import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditJobForm from './EditJobForm';

export const dynamic = 'force-dynamic';

export default async function EditJobPage({ params }: { params: { jobId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, category, location, pay_range, closes_at, description, status, company_id')
    .eq('id', params.jobId)
    .single();
  if (!job) notFound();

  const { data: membership } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', job.company_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership || !['owner', 'hr_manager'].includes(membership.role)) {
    redirect('/dashboard/company');
  }

  const { data: questions } = await supabase
    .from('screening_questions')
    .select('question_text, answer_type')
    .eq('job_id', job.id)
    .order('order_index');

  return (
    <EditJobForm
      job={job}
      initialQuestions={(questions || []).map((q) => ({ text: q.question_text, type: q.answer_type as 'text' | 'yes_no' }))}
    />
  );
}
