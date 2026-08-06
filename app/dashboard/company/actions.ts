'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function publishJob(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || !['owner', 'hr_manager'].includes(membership.role)) {
    return { error: 'You do not have permission to post jobs for this company.' };
  }

  const title = String(formData.get('title') || '');
  const category = String(formData.get('category') || 'retail');
  const location = String(formData.get('location') || '');
  const payRange = String(formData.get('payRange') || '');
  const description = String(formData.get('description') || '');
  const questionsRaw = String(formData.get('questions') || '[]');
  let questions: { text: string; type: string }[] = [];
  try { questions = JSON.parse(questionsRaw); } catch { questions = []; }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      company_id: membership.company_id,
      title,
      category,
      location,
      pay_range: payRange,
      description,
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !job) return { error: error?.message || 'Could not create job.' };

  if (questions.length) {
    await supabase.from('screening_questions').insert(
      questions.map((q, i) => ({ job_id: job.id, question_text: q.text, answer_type: q.type || 'text', order_index: i }))
    );
  }

  redirect('/dashboard/company');
}
