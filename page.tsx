import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30; // give the Anthropic call room to finish instead of timing out silently

// Accepts either { resumeText } (pasted text) or { resumeBase64, mediaType }
// (an uploaded PDF) — Claude reads PDFs natively, so no separate text-extraction
// library is needed for the PDF path.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json();
  const { resumeText, resumeBase64, mediaType } = body;
  if (!resumeText && !resumeBase64) {
    return NextResponse.json({ error: 'resumeText or resumeBase64 is required' }, { status: 400 });
  }

  const instruction = `Extract the following from this resume and return as JSON:
{
  "fullName": "", "email": "", "phone": "", "location": "",
  "education": [{"institution": "", "degree": "", "years": ""}],
  "experience": [{"employer": "", "title": "", "dates": "", "summary": ""}],
  "skills": [], "certifications": []
}
If a field isn't present, use an empty string or empty array — never invent information.`;

  const content = resumeBase64
    ? [
        { type: 'document', source: { type: 'base64', media_type: mediaType || 'application/pdf', data: resumeBase64 } },
        { type: 'text', text: instruction },
      ]
    : `${instruction}\n\nResume text:\n"""\n${resumeText}\n"""`;

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
        max_tokens: 1500,
        system: 'Extract structured resume data. Output ONLY valid JSON, no markdown fences, no commentary. Never invent information not present in the resume.',
        messages: [{ role: 'user', content }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return NextResponse.json({ error: 'AI parsing failed', detail: errText }, { status: 502 });
    }

    const data = await apiRes.json();
    const text = data.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('');
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: 'AI parsing failed', detail: err.message }, { status: 500 });
  }
}
