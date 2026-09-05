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

  const { data: company } = await supabase.from('companies').select('plan').eq('id', membership.company_id).single();
  const plan = company?.plan || 'free';
  const PLAN_LIMITS: Record<string, number> = { free: 1, starter: 5, professional: Infinity, business: Infinity, enterprise: Infinity };
  const limit = PLAN_LIMITS[plan] ?? 1;

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)
      .eq('status', 'open');
    if ((count || 0) >= limit) {
      return { error: `Your ${plan} plan allows up to ${limit} active job posting${limit === 1 ? '' : 's'}. Close an existing job or upgrade your plan to post another.` };
    }
  }

  const title = String(formData.get('title') || '');
  const category = String(formData.get('category') || 'retail');
  const location = String(formData.get('location') || '');
  const payRange = String(formData.get('payRange') || '');
  const closesAt = String(formData.get('closesAt') || '');
  const description = String(formData.get('description') || '');
  const questionsRaw = String(formData.get('questions') || '[]');
  let questions: { text: string; type: string }[] = [];
  try { questions = JSON.parse(questionsRaw); } catch { questions = []; }

  if (!closesAt) {
    return { error: 'An applications-close date is required — a job cannot be posted without one.' };
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      company_id: membership.company_id,
      title,
      category,
      location,
      pay_range: payRange,
      closes_at: closesAt,
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

// Shared by updateJob below — a company member can only touch jobs that
// belong to their own company, and only owner/hr_manager may publish or
// change one (mirrors the check already in publishJob/deleteJob).
async function assertCanManageJob(supabase: any, userId: string, jobId: string) {
  const { data: job } = await supabase.from('jobs').select('company_id, status').eq('id', jobId).single();
  if (!job) return { error: 'Job not found' } as const;

  const { data: membership } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', job.company_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || !['owner', 'hr_manager'].includes(membership.role)) {
    return { error: 'You do not have permission to manage this job.' } as const;
  }
  return { companyId: job.company_id, previousStatus: job.status as string } as const;
}

// Edits an existing posting in place instead of forcing a delete-and-repost
// (which would also wipe out every applicant already on it). Also doubles
// as the "close early" / "reopen" control via the status field.
export async function updateJob(jobId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const check = await assertCanManageJob(supabase, user.id, jobId);
  if ('error' in check) return check;

  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || '');
  const location = String(formData.get('location') || '').trim();
  const payRange = String(formData.get('payRange') || '').trim();
  const closesAt = String(formData.get('closesAt') || '');
  const description = String(formData.get('description') || '').trim();
  const status = String(formData.get('status') || 'open');
  const questionsRaw = String(formData.get('questions') || '[]');
  let questions: { text: string; type: string }[] = [];
  try { questions = JSON.parse(questionsRaw); } catch { questions = []; }

  if (!title) return { error: 'Job title is required.' };
  if (!closesAt) return { error: 'An applications-close date is required.' };
  if (!['open', 'closed'].includes(status)) return { error: 'Invalid status.' };

  const update: Record<string, any> = {
    title, category, location, pay_range: payRange, closes_at: closesAt, description, status,
  };
  // Reopening always clears whatever closed it before (auto date-reached,
  // filled, or a prior manual close). Newly closing it here tags the reason
  // distinctly from those; staying closed leaves the existing reason alone
  // (e.g. don't overwrite "filled_by_employer" just because the employer
  // edited the description while it happened to already be closed).
  if (status === 'open') update.closed_reason = null;
  else if (check.previousStatus !== 'closed') update.closed_reason = 'closed_by_employer';

  const { error } = await supabase.from('jobs').update(update).eq('id', jobId);

  if (error) {
    console.error('updateJob failed:', error);
    return { error: 'Could not save changes — please try again.' };
  }

  // Screening questions don't have a stable client-side id to diff against,
  // so replace the set wholesale — same approach as publishJob's initial
  // insert, just preceded by clearing out the old rows.
  await supabase.from('screening_questions').delete().eq('job_id', jobId);
  if (questions.length) {
    await supabase.from('screening_questions').insert(
      questions.map((q, i) => ({ job_id: jobId, question_text: q.text, answer_type: q.type || 'text', order_index: i }))
    );
  }

  redirect('/dashboard/company');
}

export async function deleteJob(jobId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: job } = await supabase.from('jobs').select('company_id').eq('id', jobId).single();
  if (!job) return { error: 'Job not found' };

  const { data: membership } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', job.company_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || !['owner', 'hr_manager'].includes(membership.role)) {
    return { error: 'You do not have permission to delete this job.' };
  }

  const { error } = await supabase.from('jobs').delete().eq('id', jobId);
  if (error) {
    console.error('deleteJob failed:', error);
    return { error: 'Could not delete this job — please try again.' };
  }

  return { success: true };
}
