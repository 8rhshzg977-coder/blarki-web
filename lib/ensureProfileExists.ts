import type { SupabaseClient, User } from '@supabase/supabase-js';

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
