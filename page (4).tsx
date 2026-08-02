import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30; // give the Anthropic call room to finish instead of timing out silently

const CATEGORY_GUIDANCE: Record<string, string> = {
  retail: 'Focus on customer service, POS/register accuracy, and reliability during peak hours.',
  restaurant: 'Focus on food safety knowledge, performance under time pressure, and teamwork during rushes.',
  construction: 'Focus on relevant certifications (OSHA, trade licenses), safety practices, and hands-on experience.',
  engineering: 'Focus on relevant design/analysis tools, technical judgment, and project constraints.',
  it: 'Focus on relevant languages/frameworks, debugging approach, and collaboration on code.',
  healthcare: 'Focus on licenses/certifications, patient-care judgment, and performance under pressure.',
  legal: 'Focus on research/drafting experience, deadline management, and relevant case-management tools.',
  finance: 'Focus on relevant software, accuracy under deadline, and specific accounting/finance experience.',
  education: 'Focus on classroom management, adapting instruction, and relevant certifications.',
};

export async function POST(req: Request) {
  // Require a logged-in company member — don't let this endpoint be called anonymously.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { title, category, location, payRange, requirements, context } = await req.json();
  if (!title || !category) {
    return NextResponse.json({ error: 'title and category are required' }, { status: 400 });
  }

  const prompt = `A company is posting this job:
Title: ${title}
Category: ${category}
Location: ${location || 'not specified'}
Pay range: ${payRange || 'not specified'}
Must-have requirements: ${requirements || 'none specified'}
Additional context from the employer: ${context || 'none'}

First, think through what this specific role actually needs day-to-day. ${CATEGORY_GUIDANCE[category] || ''}

Then produce:
1. A clear, accurate, candidate-facing job description (150-250 words). No exaggerated claims, no requirements that weren't given or reasonably implied by the title/category.
2. 4-6 screening questions that would genuinely help tell a qualified candidate from an unqualified one for THIS specific role. Base them only on job-related qualifications, skills, and experience. Never write a question that tries to infer personality, honesty, or protected characteristics.

Return JSON exactly in this shape, nothing else:
{"description": "...", "questions": ["...", "...", "..."]}`;

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
        max_tokens: 1200,
        system: 'You write hiring content for a job platform. Output ONLY valid JSON, no markdown fences, no commentary. Never infer or reference a candidate\'s protected characteristics.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return NextResponse.json({ error: 'AI generation failed', detail: errText }, { status: 502 });
    }

    const data = await apiRes.json();
    const text = data.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('');
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: 'AI generation failed', detail: err.message }, { status: 500 });
  }
}
