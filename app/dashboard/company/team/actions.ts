'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getOwnCompanyMembership(supabase: any, userId: string) {
  const { data: membership } = await supabase
    .from('company_members')
    .select('id, company_id, role')
    .eq('user_id', userId)
    .maybeSingle();
  if (!membership || !['owner', 'hr_manager'].includes(membership.role)) return null;
  return membership;
}

// Invites are always HR Manager — the PRD scopes team roles to Owner + HR
// Manager for MVP, and Owner is reserved for whoever's company this
// already is, so there's nothing else to pick from a role dropdown yet.
export async function inviteTeamMember(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const membership = await getOwnCompanyMembership(supabase, user.id);
  if (!membership) return { error: 'You do not have permission to invite teammates.' };

  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }

  const admin = createAdminClient();

  const { data: existingInvite } = await admin
    .from('company_invites')
    .select('id')
    .eq('company_id', membership.company_id)
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingInvite) return { error: 'There is already a pending invite for this email.' };

  const { data: newInvite, error: insertError } = await admin
    .from('company_invites')
    .insert({ company_id: membership.company_id, email, role: 'hr_manager', invited_by: user.id })
    .select('id')
    .single();
  if (insertError || !newInvite) {
    console.error('inviteTeamMember insert failed:', insertError);
    return { error: 'Could not create the invite — please try again.' };
  }

  const headersList = headers();
  const siteUrl = `https://${headersList.get('host')}`;
  const { error: emailError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { user_type: 'company_member' },
    redirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent('/auth/reset-password')}`,
  });

  if (emailError) {
    // Roll back the invite row — most commonly this fails because the
    // email already has an account, and company_members.user_id is unique
    // (one company per person), so we can't silently attach them here.
    await admin.from('company_invites').delete().eq('id', newInvite.id);
    if (emailError.message?.toLowerCase().includes('already been registered') || emailError.message?.toLowerCase().includes('already registered')) {
      return { error: 'That email already has a Blarki account, so it can\'t be added to a new company automatically — they\'ll need to be invited a different way for now.' };
    }
    console.error('inviteTeamMember email failed:', emailError);
    return { error: 'Could not send the invite email — please try again.' };
  }

  revalidatePath('/dashboard/company/team');
  return { success: true };
}

export async function revokeInvite(inviteId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const membership = await getOwnCompanyMembership(supabase, user.id);
  if (!membership) return { error: 'You do not have permission to manage invites.' };

  const { error } = await supabase
    .from('company_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)
    .eq('company_id', membership.company_id);
  if (error) return { error: 'Could not revoke this invite — please try again.' };

  revalidatePath('/dashboard/company/team');
  return { success: true };
}

// Only the owner can remove someone — an HR Manager shouldn't be able to
// remove their peers (or the owner).
export async function removeTeamMember(memberId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: ownMembership } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!ownMembership || ownMembership.role !== 'owner') {
    return { error: 'Only the company owner can remove teammates.' };
  }

  const { data: target } = await supabase.from('company_members').select('id, role, company_id').eq('id', memberId).single();
  if (!target || target.company_id !== ownMembership.company_id) return { error: 'Teammate not found.' };
  if (target.role === 'owner') return { error: 'The owner cannot be removed.' };

  // company_members predates this feature and (per supabase/migrations/
  // 0002_rls_reference.sql) only has select/insert policies on record —
  // deleting through the regular client risks a silent no-op if there's no
  // delete policy live. The ownership/role checks above already did the
  // real authorization, so this goes through the service-role client.
  const admin = createAdminClient();
  const { error } = await admin.from('company_members').delete().eq('id', memberId);
  if (error) return { error: 'Could not remove this teammate — please try again.' };

  revalidatePath('/dashboard/company/team');
  return { success: true };
}
