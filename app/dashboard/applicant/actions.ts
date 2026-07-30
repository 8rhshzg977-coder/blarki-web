'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

  if (!applicantProfile) return { error: 'Complete your profile before applying.' };

  const { data: application, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, applicant_id: applicantProfile.id, status: 'applied' })
    .select('id')
    .single();

  if (error || !application) return { error: error?.message || 'Could not submit application.' };

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

  redirect('/dashboard/applicant');
}
