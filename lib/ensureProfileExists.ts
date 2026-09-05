import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

// Runs the first time a newly-confirmed user actually has a session — creates their
// profiles row, and either a company (+ owner membership) or an applicant profile,
// based on what they picked at signup (stored in auth user_metadata).
export async function ensureProfileExists(supabase: SupabaseClient, user: User) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return;

  const userType = (user.user_metadata?.user_type as string) || 'applicant';
  const name = (user.user_metadata?.name as string) || '';

  await supabase.from('profiles').insert({ id: user.id, email: user.email, user_type: userType });

  if (userType === 'company_member') {
    // A teammate who arrived via a team invite (app/dashboard/company/team)
    // joins the company that invited them instead of getting a brand-new
    // one of their own — matched by email using the service-role client,
    // since this user has no company_members row yet for RLS to key off.
    const admin = createAdminClient();
    const email = (user.email || '').toLowerCase();
    const { data: invites } = await admin
      .from('company_invites')
      .select('id, company_id, role')
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);
    const invite = invites?.[0];

    if (invite) {
      await admin.from('company_members').insert({ company_id: invite.company_id, user_id: user.id, role: invite.role });
      await admin.from('company_invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', invite.id);
      return;
    }

    const { data: company } = await supabase
      .from('companies')
      .insert({ name: name || 'My company' })
      .select('id')
      .single();
    if (company) {
      await supabase.from('company_members').insert({
        company_id: company.id,
        user_id: user.id,
        role: 'owner',
      });
    }
  } else {
    await supabase.from('applicant_profiles').insert({
      user_id: user.id,
      full_name: name,
    });
  }
}
