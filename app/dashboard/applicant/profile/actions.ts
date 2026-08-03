'use server';

import { createClient } from '@/lib/supabase/server';

export async function saveApplicantProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedExperience = formData.get('parsedExperience');
  const parsedEducation = formData.get('parsedEducation');
  const parsedCertifications = formData.get('parsedCertifications');

  const update: Record<string, any> = {
    full_name: String(formData.get('fullName') || ''),
    location: String(formData.get('location') || ''),
    bio: String(formData.get('bio') || ''),
    skills: String(formData.get('skills') || '').split(',').map((s) => s.trim()).filter(Boolean),
    resume_text: String(formData.get('resumeText') || ''),
    portfolio_url: String(formData.get('portfolioUrl') || ''),
    linkedin_url: String(formData.get('linkedinUrl') || ''),
    availability: String(formData.get('availability') || ''),
    desired_salary: formData.get('desiredSalary') ? Number(formData.get('desiredSalary')) : null,
  };
  const resumeUrl = formData.get('resumeUrl');
  if (resumeUrl) update.resume_url = String(resumeUrl);
  if (parsedExperience) { try { update.parsed_experience = JSON.parse(String(parsedExperience)); } catch {} }
  if (parsedEducation) { try { update.parsed_education = JSON.parse(String(parsedEducation)); } catch {} }
  if (parsedCertifications) { try { update.parsed_certifications = JSON.parse(String(parsedCertifications)); } catch {} }

  const { data: updated, error } = await supabase
    .from('applicant_profiles')
    .upsert({ user_id: user.id, ...update }, { onConflict: 'user_id' })
    .select();

  if (error) {
    console.error('saveApplicantProfile failed:', error);
    return { error: `Save failed — ${error.message} (code: ${error.code || 'unknown'})` };
  }
  if (!updated || updated.length === 0) {
    console.error('saveApplicantProfile: upsert returned no row for user', user.id);
    return { error: 'Your profile could not be saved — please contact support and mention "upsert returned no row".' };
  }
  return { success: true };
}
