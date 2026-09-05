// LinkedIn-style profile strength meter — pure logic against fields that
// already exist on applicant_profiles, no new columns or AI calls needed.
// Each item is worth an equal share of 100%, rounded to the nearest whole
// number so the total always reads as a clean percentage.

export type CompletionItem = { label: string; done: boolean };

export function getProfileCompletion(profile: {
  full_name?: string | null;
  resume_text?: string | null;
  resume_url?: string | null;
  skills?: string[] | null;
  bio?: string | null;
  location?: string | null;
  portfolio_url?: string | null;
  linkedin_url?: string | null;
  availability?: string | null;
} | null | undefined): { percent: number; items: CompletionItem[] } {
  const items: CompletionItem[] = [
    { label: 'Full name', done: Boolean(profile?.full_name?.trim()) },
    { label: 'Resume uploaded', done: Boolean(profile?.resume_text?.trim() || profile?.resume_url) },
    { label: 'Skills added', done: Boolean(profile?.skills && profile.skills.length > 0) },
    { label: 'Bio written', done: Boolean(profile?.bio?.trim()) },
    { label: 'Location added', done: Boolean(profile?.location?.trim()) },
    { label: 'Portfolio or LinkedIn', done: Boolean(profile?.portfolio_url?.trim() || profile?.linkedin_url?.trim()) },
    { label: 'Availability set', done: Boolean(profile?.availability?.trim()) },
  ];
  const percent = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { percent, items };
}
