'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildDecisionFeedback } from '@/lib/decisionFeedback';

const VALID_STATUSES = [
  'applied', 'ai_resume_review', 'recruiter_review', 'hiring_manager_review',
  'interview_requested', 'interview_scheduled', 'interview_completed',
  'final_decision', 'offer_sent', 'hired', 'rejected',
];

const STATUS_LABELS: Record<string, string> = {
  applied: 'received', ai_resume_review: 'being reviewed by our AI', recruiter_review: 'being reviewed by the hiring team',
  hiring_manager_review: 'being reviewed by the hiring manager', interview_requested: 'moving to the interview stage',
  interview_scheduled: 'scheduled for an interview', interview_completed: 'past the interview stage',
  final_decision: 'in final decision', offer_sent: 'moving forward with an offer', hired: 'accepted — you got the job!',
  rejected: 'not moving forward this time',
};

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

  // Notify the applicant of the status change. On a final decision
  // (hired/rejected), prefer specific AI-grounded feedback over the
  // generic status label — see lib/decisionFeedback.ts for why this isn't
  // optional per the product's own hiring-feedback requirement.
  const { data: application } = await supabase
    .from('applications')
    .select('applicant_profiles(user_id), match_reasoning')
    .eq('id', applicationId)
    .single();
  const { data: job } = await supabase.from('jobs').select('title').eq('id', jobId).single();
  const applicantUserId = (application as any)?.applicant_profiles?.user_id;
  if (applicantUserId) {
    const admin = createAdminClient();
    const jobTitle = job?.title || 'a role';
    const decisionFeedback = (newStatus === 'hired' || newStatus === 'rejected')
      ? buildDecisionFeedback(newStatus, jobTitle, (application as any)?.match_reasoning)
      : null;
    await admin.from('notifications').insert({
      user_id: applicantUserId,
      type: 'status_change',
      channel: 'in_app',
      body: decisionFeedback || `Your application for ${jobTitle} is now ${STATUS_LABELS[newStatus] || newStatus}.`,
      related_application_id: applicationId,
      read: false,
    });
  }

  revalidatePath(`/dashboard/company/jobs/${jobId}/applicants`);
  return { success: true };
}

// Sends (or re-sends/edits, before the applicant responds) a formal offer —
// start date + a free-text next-steps message — rather than the employer
// just flipping a status with no detail on the applicant's side. The
// applicant explicitly accepts or declines from their dashboard
// (respondToOffer, in app/dashboard/applicant/actions.ts), which is what
// actually moves the application to hired/rejected.
export async function sendOffer(applicationId: string, jobId: string, startDate: string, message: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error: offerError } = await supabase
    .from('offers')
    .upsert(
      { application_id: applicationId, start_date: startDate || null, message: message || null, status: 'pending', responded_at: null },
      { onConflict: 'application_id' }
    );
  if (offerError) {
    console.error('sendOffer upsert failed:', offerError);
    if (offerError.code === '42P01' || offerError.message?.includes('does not exist')) {
      return { error: 'Offers isn\'t set up on the database yet — run supabase/migrations/0004_offers.sql in Supabase, then try again.' };
    }
    return { error: 'Could not send the offer — please try again.' };
  }

  const { error: statusError } = await supabase.from('applications').update({ status: 'offer_sent' }).eq('id', applicationId);
  if (statusError) console.error('Could not update application status:', statusError);

  const { data: application } = await supabase.from('applications').select('applicant_profiles(user_id)').eq('id', applicationId).single();
  const { data: job } = await supabase.from('jobs').select('title').eq('id', jobId).single();
  const applicantUserId = (application as any)?.applicant_profiles?.user_id;
  if (applicantUserId) {
    const admin = createAdminClient();
    const jobTitle = job?.title || 'a role';
    const startDateText = startDate
      ? `, starting ${new Date(`${startDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
      : '';
    await admin.from('notifications').insert({
      user_id: applicantUserId,
      type: 'offer_sent',
      channel: 'in_app',
      body: `You've received an offer for ${jobTitle}${startDateText}. Review the details and respond from your dashboard.`,
      related_application_id: applicationId,
      read: false,
    });
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
