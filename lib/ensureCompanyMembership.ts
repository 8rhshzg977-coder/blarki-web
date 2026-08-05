import type { SupabaseClient } from '@supabase/supabase-js';

// Ensures a company_members row exists for this user, creating the company
// too if needed. Mirrors the setup that should have happened at signup —
// self-heals accounts from earlier setup issues, same pattern as the
// applicant-profiles fix.
export async function ensureCompanyMembership(supabase: SupabaseClient, userId: string, userEmail: string) {
  const { data: existing } = await supabase
    .from('company_members')
    .select('company_id, role, companies(name)')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return existing;

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: userEmail.split('@')[0] + "'s company" })
    .select('id, name')
    .single();
  if (companyError || !company) throw new Error(companyError?.message || 'Could not create company');

  const { error: memberError } = await supabase
    .from('company_members')
    .insert({ company_id: company.id, user_id: userId, role: 'owner' });
  if (memberError) throw new Error(memberError.message);

  return { company_id: company.id, role: 'owner', companies: { name: company.name } };
}
