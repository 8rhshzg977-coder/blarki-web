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

  return { success: true, applicationId: application.id };
}

export async function respondToInterview(interviewId: string, accept: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, application_id, confirmed_slot, applications(job_id)')
    .eq('id', interviewId)
    .single();
  if (!interview) return { error: 'Interview not found' };

  if (!accept) {
    await supabase.from('interviews').update({ confirmation_status: 'declined', status: 'cancelled' }).eq('id', interviewId);
    await supabase.from('applications').update({ status: 'recruiter_review' }).eq('id', interview.application_id);
    return { success: true, accepted: false };
  }

  // Generate quick, practical prep info for the accepted interview.
  let prepInfo = '';
  try {
    const jobId = (interview as any).applications?.job_id;
    const { data: job } = await supabase.from('jobs').select('title, category, location').eq('id', jobId).single();
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: 'Write brief, practical interview-prep advice for a job applicant. Plain text, 3-5 short bullet points, no markdown headers. Cover: how early to arrive, general dress-code expectation for this type of role, and anything reasonable to bring (resume copy, ID, portfolio if relevant). Keep it generic and safe — do not invent specific company policies you were not told.',
        messages: [{ role: 'user', content: `Job: ${job?.title} (${job?.category}) at a company in ${job?.location}. Write the prep tips.` }],
      }),
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      prepInfo = data.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('');
    }
  } catch (err) {
    console.error('Interview prep generation failed:', err);
  }

  await supabase.from('interviews').update({ confirmation_status: 'confirmed', status: 'scheduled', prep_info: prepInfo }).eq('id', interviewId);
  await supabase.from('applications').update({ status: 'interview_scheduled' }).eq('id', interview.application_id);

  return { success: true, accepted: true, prepInfo };
}
