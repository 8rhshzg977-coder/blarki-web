import { createAdminClient } from '@/lib/supabase/admin';

// Daily limit per feature, per user. Job description generation gets more
// headroom since an employer might legitimately post several roles in a
// day, each needing a regeneration or two — the applicant-side resume
// features are tighter since there's less legitimate reason to hit them
// dozens of times. Change these numbers to adjust — nothing else needs to
// change.
const DAILY_LIMITS: Record<string, number> = {
  parse_resume: 3,
  review_resume: 3,
  generate_job_content: 8,
};
const DEFAULT_LIMIT = 3;

export async function checkAndLogAiUsage(userId: string, actionType: string): Promise<{ allowed: boolean; remaining: number }> {
  const limit = DAILY_LIMITS[actionType] ?? DEFAULT_LIMIT;
  const admin = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from('ai_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_type', actionType)
    .gte('created_at', todayStart.toISOString());

  const used = count || 0;
  if (used >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await admin.from('ai_usage_log').insert({ user_id: userId, action_type: actionType });
  return { allowed: true, remaining: limit - used - 1 };
}
