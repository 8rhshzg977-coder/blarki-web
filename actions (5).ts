import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30; // give the Anthropic call room to finish instead of timing out silently

// General resume feedback, or job-tailored feedback when jobId is provided
// (PRD: "Improve my resume for this job").
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { resumeText, jobId } = await req.json();
  if (!resumeText) return NextResponse.json({ error: 'resumeText is required' }, { status: 400 });

  let jobContext = '';
  if (jobId) {
    const { data: job } = await supabase.from('jobs').select('title, description, requirements').eq('id', jobId).single();
    if (job) {
      jobContext = `\n\nTailor this feedback specifically to this job:\nTitle: ${job.title}\nDescription: ${job.description}\nRequirements: ${job.requirements || 'none specified'}`;
    }
  }

  const prompt = `Review this resume and give constructive feedback.${jobContext}

Resume:
"""
${resumeText}
"""

Return JSON:
{
  "strengths": ["...", "..."],
  "missingSkills": ["...", "..."],
  "qualityNotes": ["...", "..."],
  "suggestedImprovements": ["...", "..."]${jobId ? ',\n  "missingKeywords": ["...", "..."]' : ''}
}
Base everything only on what's actually in the resume text (and the job description, if given). Never invent claims about the person.`;

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
        system: 'You give constructive, specific resume feedback. Output ONLY valid JSON, no markdown fences, no commentary.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return NextResponse.json({ error: 'AI review failed', detail: errText }, { status: 502 });
    }
    const data = await apiRes.json();
    const text = data.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('');
    return NextResponse.json(JSON.parse(text));
  } catch (err: any) {
    return NextResponse.json({ error: 'AI review failed', detail: err.message }, { status: 500 });
  }
}
