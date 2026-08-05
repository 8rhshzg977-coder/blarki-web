import { extractJson } from '@/lib/extractJson';
import type { SupabaseClient } from '@supabase/supabase-js';

// Shared scoring logic — used directly by server actions (no HTTP call, no
// auth-forwarding problem) and by the /api/score-application route (for any
// future client-triggered re-scoring). Strictly job-related signal only,
// per PRD Part V — see the system prompt below for the full rule set.
export async function scoreApplication(supabase: SupabaseClient, applicationId: string) {
  const { data: application } = await supabase
    .from('applications')
    .select('id, job_id, applicant_id')
    .eq('id', applicationId)
    .single();
  if (!application) throw new Error('Application not found');

  const { data: job } = await supabase
    .from('jobs')
    .select('title, description, requirements, skills')
    .eq('id', application.job_id)
    .single();

  const { data: applicant } = await supabase
    .from('applicant_profiles')
    .select('skills, resume_text, parsed_experience, parsed_education, parsed_certifications')
    .eq('id', application.applicant_id)
    .single();

  const { data: answers } = await supabase
    .from('application_answers')
    .select('answer_text, screening_questions(question_text)')
    .eq('application_id', applicationId);

  const answersText = (answers || [])
    .map((a: any) => `Q: ${a.screening_questions?.question_text}\nA: ${a.answer_text || '(no answer)'}`)
    .join('\n\n');

  const prompt = `Job:
Title: ${job?.title}
Description: ${job?.description}
Requirements: ${job?.requirements || 'none specified'}
Desired skills: ${(job?.skills || []).join(', ') || 'none specified'}

Applicant:
Skills: ${(applicant?.skills || []).join(', ') || 'none listed'}
Resume: ${applicant?.resume_text || 'not provided'}
Experience: ${JSON.stringify(applicant?.parsed_experience || [])}
Education: ${JSON.stringify(applicant?.parsed_education || [])}
Certifications: ${JSON.stringify(applicant?.parsed_certifications || [])}

Screening answers:
${answersText || '(none)'}

Score this applicant's fit for this specific job using ONLY the job-related information above.
Return JSON exactly in this shape:
{
  "matchScore": 0-100,
  "reasoning": ["specific reason 1", "specific reason 2", "..."],
  "strengths": ["...", "..."],
  "areasToImprove": ["...", "..."],
  "summary": "one plain-language paragraph an employer reads first, e.g. 'This candidate has 6 years of project management experience, holds OSHA 30 and AutoCAD certifications, exceeds the required experience, but does not have bridge inspection experience.'"
}`;

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
      system: `You score job applicants for employers. Rules, no exceptions:
- Use ONLY job-related qualifications: skills, experience, education, certifications, and screening-answer quality.
- Never use or infer race, gender, age, disability, religion, national origin, or any protected characteristic.
- Never infer personality, honesty, or "vibes" from writing style or word choice.
- Every score must come with specific, concrete reasons an employer could point to and defend.
- Output ONLY valid JSON, no markdown fences, no commentary.`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!apiRes.ok) throw new Error(`Anthropic API error: ${await apiRes.text()}`);

  const data = await apiRes.json();
  const text = data.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('');
  const parsed = extractJson(text);

  const { error: updateError } = await supabase
    .from('applications')
    .update({
      match_score: parsed.matchScore,
      match_reasoning: { reasoning: parsed.reasoning, strengths: parsed.strengths, areas_to_improve: parsed.areasToImprove },
      ai_summary: parsed.summary,
    })
    .eq('id', applicationId);

  if (updateError) throw new Error(`Could not save score: ${updateError.message}`);
  return parsed;
}
