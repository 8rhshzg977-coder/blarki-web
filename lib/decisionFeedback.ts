// PRD requirement: a hire/reject decision always ships with specific,
// actionable feedback — never a bare status change. We already have the
// AI's per-application strengths/areas-to-improve sitting in
// applications.match_reasoning once ranking has run (Starter+ plans, see
// lib/scoreApplication.ts) — this reuses that instead of asking the
// employer to type feedback by hand or leaving applicants with nothing.
// Returns null when there's no reasoning to draw on (Free plan, or scoring
// hasn't completed) — the caller falls back to its own generic message.

type MatchReasoning = { strengths?: string[]; areas_to_improve?: string[] } | null | undefined;

export function buildDecisionFeedback(status: 'hired' | 'rejected', jobTitle: string, matchReasoning: MatchReasoning): string | null {
  if (status === 'hired') {
    const strengths = matchReasoning?.strengths?.filter(Boolean) || [];
    const highlight = strengths.length ? ` What stood out: ${strengths.slice(0, 2).join(' and ')}.` : '';
    // The employer moved this straight to Hired without sending a formal
    // offer through Blarki (that flow has its own richer "what's next"
    // panel — see OfferCard.tsx) — still worth a next-step pointer here
    // rather than leaving it at a bare congratulations.
    return `You got the job! Your application for ${jobTitle} was accepted.${highlight} The employer should be in touch directly with start date and next steps — if you don't hear anything soon, it's worth reaching out to them.`;
  }

  const areas = matchReasoning?.areas_to_improve?.filter(Boolean) || [];
  if (!areas.length) return null;
  return `Your application for ${jobTitle} wasn't selected this time. Another candidate was a closer match on: ${areas.slice(0, 2).join(' and ')}. Strengthening that could help with future applications.`;
}
