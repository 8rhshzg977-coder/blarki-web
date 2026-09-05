'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// companies is an existing table and (per supabase/migrations/
// 0002_rls_reference.sql) its update policy only covers 'owner', not
// 'hr_manager' — so this goes through the service-role client after doing
// the real authorization check here, the same defensive pattern used for
// removeTeamMember, rather than risk a silent no-op if an hr_manager saves
// changes and RLS quietly drops the write.
export async function updateCompanyProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership || !['owner', 'hr_manager'].includes(membership.role)) {
    return { error: 'You do not have permission to edit this company profile.' };
  }

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const logoUrl = String(formData.get('logoUrl') || '').trim();

  if (!name) return { error: 'Company name is required.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('companies')
    .update({ name, description, logo_url: logoUrl || null })
    .eq('id', membership.company_id);
  if (error) {
    console.error('updateCompanyProfile failed:', error);
    return { error: 'Could not save changes — please try again.' };
  }

  revalidatePath('/dashboard/company/profile');
  revalidatePath(`/companies/${membership.company_id}`);
  return { success: true };
}
