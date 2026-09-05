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
  const tagline = String(formData.get('tagline') || '').trim();
  const industry = String(formData.get('industry') || '').trim();
  const companySize = String(formData.get('companySize') || '').trim();
  const headquarters = String(formData.get('headquarters') || '').trim();
  const websiteUrlRaw = String(formData.get('websiteUrl') || '').trim();
  const coverUrl = String(formData.get('coverUrl') || '').trim();
  const foundedYearRaw = String(formData.get('foundedYear') || '').trim();
  const photosRaw = String(formData.get('photos') || '[]');

  if (!name) return { error: 'Company name is required.' };

  let websiteUrl = '';
  if (websiteUrlRaw) {
    websiteUrl = /^https?:\/\//i.test(websiteUrlRaw) ? websiteUrlRaw : `https://${websiteUrlRaw}`;
    try { new URL(websiteUrl); } catch { return { error: 'Enter a valid website address.' }; }
  }

  let foundedYear: number | null = null;
  if (foundedYearRaw) {
    const n = Number(foundedYearRaw);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(n) || n < 1800 || n > currentYear) {
      return { error: `Founded year must be between 1800 and ${currentYear}.` };
    }
    foundedYear = n;
  }

  let photos: string[] = [];
  try { photos = JSON.parse(photosRaw); } catch { photos = []; }

  const admin = createAdminClient();
  const { error } = await admin
    .from('companies')
    .update({
      name,
      description,
      logo_url: logoUrl || null,
      tagline: tagline || null,
      industry: industry || null,
      company_size: companySize || null,
      headquarters: headquarters || null,
      website_url: websiteUrl || null,
      cover_url: coverUrl || null,
      founded_year: foundedYear,
      photos,
    })
    .eq('id', membership.company_id);
  if (error) {
    console.error('updateCompanyProfile failed:', error);
    return { error: 'Could not save changes — please try again.' };
  }

  revalidatePath('/dashboard/company/profile');
  revalidatePath(`/companies/${membership.company_id}`);
  return { success: true };
}
