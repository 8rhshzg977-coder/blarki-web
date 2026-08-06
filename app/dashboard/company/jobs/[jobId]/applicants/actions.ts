'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

  revalidatePath(`/dashboard/company/jobs/${jobId}/applicants`);
  return { success: true };
}
