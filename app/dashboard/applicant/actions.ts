'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { scoreApplication } from '@/lib/scoreApplication';

export async function submitApplication(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const jobId = String(formData.get('jobId'));

  const { data: applicantProfile } = await supabase
    .from('applicant_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!applicantProfile) {
    redirect('/dashboard/applicant/profile?notice=Complete+your+profile+before+applying');
  }

  const { data: application, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, applicant_id: applicantProfile.id, status: 'applied' })
    .select('id')
    .single();

  if (error || !application) {
    if (error?.code === '23505') {
      // Unique constraint on (job_id, applicant_id) — they already applied.
      redirect(`/dashboard/applicant/apply/${jobId}?error=You've+already+applied+to+this+job`);
    }
    console.error('submitApplication insert failed:', error);
    redirect(`/dashboard/applicant/apply/${jobId}?error=Could+not+submit+application+-+please+try+again`);
  }

  const { data: questions } = await supabase
    .from('screening_questions')
    .select('id')
    .eq('job_id', jobId)
    .order('order_index');

  if (questions) {
    const answerRows = questions.map((q) => ({
      application_id: application.id,
      question_id: q.id,
      answer_text: String(formData.get(`answer-${q.id}`) || ''),
    }));
    if (answerRows.length) await supabase.from('application_answers').insert(answerRows);
  }

  // Score before redirecting — Vercel can freeze the function immediately
  // after the response is sent, which would silently kill a background
  // call. A failed score shouldn't block the application itself, though.
  try {
    await scoreApplication(supabase, application.id);
  } catch (err) {
    console.error('Scoring failed (application still submitted):', err);
  }

  redirect('/dashboard/applicant');
}
