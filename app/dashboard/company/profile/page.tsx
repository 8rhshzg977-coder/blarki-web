import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureCompanyMembership } from '@/lib/ensureCompanyMembership';
import CompanyProfileForm from './CompanyProfileForm';

export const dynamic = 'force-dynamic';

export default async function CompanyProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const membership = await ensureCompanyMembership(supabase, user.id, user.email || 'you@example.com');

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, description, logo_url, tagline, industry, company_size, headquarters, website_url, cover_url, founded_year, photos')
    .eq('id', membership.company_id)
    .single();
  if (!company) redirect('/dashboard/company');

  return <CompanyProfileForm company={company} />;
}
