'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_STATUSES = [
  'applied', 'ai_resume_review', 'recruiter_review', 'hiring_manager_review',
  'interview_requested', 'interview_scheduled', 'interview_completed',
  'final_decision', 'offer_sent', 'hired', 'rejected',
];

export async function updateApplicationStatus(applicationId: string, newStatus: string, jobId: string) {
  if (!VALID_STATUSES.includes(newStatus)) return { error: 'Invalid status' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('applications')
    .update({ status: newStatus })
    .eq('id', applicationId);

  if (error) {
    console.error('updateApplicationStatus failed:', error);
    return { error: 'Could not update status — please try again.' };
  }

  // Hiring someone closes the job immediately, even if its closing date
  // hasn't arrived yet — no reason to keep taking applications for a role
  // that's already filled.
  if (newStatus === 'hired') {
    await supabase.from('jobs').update({ status: 'closed', closed_reason: 'filled_by_employer' }).eq('id', jobId);
  }

  revalidatePath(`/dashboard/company/jobs/${jobId}/applicants`);
  return { success: true };
}

export async function scheduleInterview(applicationId: string, jobId: string, dateTimeIso: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Create the interview row and move the application into the interview stage.
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .insert({ application_id: applicationId, confirmed_slot: dateTimeIso, status: 'proposed', confirmation_status: 'awaiting_response' })
    .select('id')
    .single();
  if (interviewError || !interview) {
    console.error('scheduleInterview insert failed:', interviewError);
    return { error: 'Could not schedule the interview — please try again.' };
  }

  const { error: statusError } = await supabase
    .from('applications')
    .update({ status: 'interview_requested' })
    .eq('id', applicationId);
  if (statusError) console.error('Could not update application status:', statusError);

  // Notify the applicant — this crosses account ownership (employer writing
  // to the applicant's notifications), so it goes through the admin client
  // rather than fighting standard per-user RLS for a legitimate system action.
  const { data: application } = await supabase
    .from('applications')
    .select('applicant_id, applicant_profiles(user_id)')
    .eq('id', applicationId)
    .single();
  const { data: job } = await supabase.from('jobs').select('title').eq('id', jobId).single();

  const applicantUserId = (application as any)?.applicant_profiles?.user_id;
  if (applicantUserId) {
    const admin = createAdminClient();
    await admin.from('notifications').insert({
      user_id: applicantUserId,
      type: 'interview_invite',
      channel: 'in_app',
      body: `You've been invited to interview for ${job?.title || 'a position'} on ${new Date(dateTimeIso).toLocaleString()}. Please respond.`,
      related_application_id: applicationId,
      read: false,
    });
  }

  revalidatePath(`/dashboard/company/jobs/${jobId}/applicants`);
  return { success: true };
}
