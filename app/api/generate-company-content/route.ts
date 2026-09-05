import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractJson } from '@/lib/extractJson';
import { checkAndLogAiUsage } from '@/lib/aiRateLimit';

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, companies(plan)')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: 'No company found for this account' }, { status: 403 });
  const plan = (membership as any)?.companies?.plan || 'free';

  const { allowed } = await checkAndLogAiUsage(user.id, 'generate_company_content', plan);
  if (!allowed) {
    const upgradeHint = plan === 'free' ? ' Upgrade to Starter for unlimited AI company-page writing.' : '';
    return NextResponse.json({ error: `You've reached today's limit for this.${upgradeHint} It resets at midnight — try again tomorrow, or write it manually for now.` }, { status: 429 });
  }

  const { name, industry, notes } = await req.json();
  if (!name) return NextResponse.json({ error: 'Company name is required' }, { status: 400 });

  // Pull the company's own open job titles as free context — gives the AI
  // something real to ground the writing in instead of just the bare name,
  // without requiring the employer to re-type anything they've already
  // told Blarki via their job postings.
  const { data: jobs } = await supabase
    .from('jobs')
    .select('title, category')
    .eq('company_id', membership.company_id)
    .eq('status', 'open')
    .limit(10);
  const jobTitles = (jobs || []).map((j: any) => j.title).join(', ') || 'not specified';

  const prompt = `Write copy for a company's public hiring page.
Company name: ${name}
Industry: ${industry || 'not specified'}
Roles currently hiring for: ${jobTitles}
What the employer told us about the company: ${notes || 'nothing further provided'}

Write:
1. A tagline — one short line (under 100 characters), no corporate buzzwords, sounds like a real place ("Family-owned since 1998", not "Leveraging synergy to deliver excellence").
2. A 2-3 paragraph "about us" description (150-250 words) aimed at someone deciding whether to apply — approachable, specific, honest. Do NOT invent facts not given above (no fake founding stories, awards, statistics, or claims about size/culture that weren't provided) — if there's little to go on, keep it short and grounded rather than padding with generic claims.

Return JSON exactly in this shape, nothing else:
{"tagline": "...", "description": "..."}`;

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        system: 'You write honest, grounded hiring-page copy for a job platform. Output ONLY valid JSON, no markdown fences, no commentary. Never fabricate facts, statistics, or claims the employer did not provide.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return NextResponse.json({ error: 'AI generation failed', detail: errText }, { status: 502 });
    }

    const data = await apiRes.json();
    const text = data.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('');
    const parsed = extractJson(text);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: 'AI generation failed', detail: err.message }, { status: 500 });
  }
}
