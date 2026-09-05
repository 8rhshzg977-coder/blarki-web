import { createAdminClient } from '@/lib/supabase/admin';

// Daily limit per feature, per user. Job description generation gets more
// headroom since an employer might legitimately post several roles in a
// day, each needing a regeneration or two — the applicant-side resume
// features are tighter since there's less legitimate reason to hit them
// dozens of times. Change these numbers to adjust — nothing else needs to
// change.
//
// `generate_job_content` is company-billing-plan-aware (see PLAN_DAILY_LIMITS
// below) — everything else here is a flat per-user limit regardless of plan,
// since applicant-side resume tools aren't part of the company subscription.
const DAILY_LIMITS: Record<string, number> = {
  parse_resume: 3,
  review_resume: 3,
  generate_job_content: 3,
  generate_company_content: 3,
};
const DEFAULT_LIMIT = 3;

// Plan-specific override for actions billed against a company's subscription.
// A number here replaces DAILY_LIMITS[actionType] for that plan; omit a plan
// to fall back to the flat default above. `Infinity` reads as "unlimited".
const PLAN_DAILY_LIMITS: Record<string, Record<string, number>> = {
  generate_job_content: {
    free: 3,
    starter: Infinity,
    professional: Infinity,
    business: Infinity,
    enterprise: Infinity,
  },
  generate_company_content: {
    free: 3,
    starter: Infinity,
    professional: Infinity,
    business: Infinity,
    enterprise: Infinity,
  },
};

export async function checkAndLogAiUsage(userId: string, actionType: string, plan?: string): Promise<{ allowed: boolean; remaining: number }> {
  const planLimit = plan ? PLAN_DAILY_LIMITS[actionType]?.[plan] : undefined;
  const limit = planLimit ?? DAILY_LIMITS[actionType] ?? DEFAULT_LIMIT;
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
