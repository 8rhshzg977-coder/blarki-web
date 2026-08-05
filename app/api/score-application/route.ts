import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scoreApplication } from '@/lib/scoreApplication';

export const maxDuration = 30;

// Thin wrapper around the shared scoring function, for any future
// client-triggered re-scoring. The applicant-submission flow calls
// scoreApplication() directly (see app/dashboard/applicant/actions.ts) —
// this route exists for cases outside that flow.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { applicationId } = await req.json();
  if (!applicationId) return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });

  try {
    const result = await scoreApplication(supabase, applicationId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: 'Scoring failed', detail: err.message }, { status: 500 });
  }
}
