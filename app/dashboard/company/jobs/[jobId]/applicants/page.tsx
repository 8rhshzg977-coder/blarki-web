import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function ApplicantsPage({ params }: { params: { jobId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, location, company_id')
    .eq('id', params.jobId)
    .single();

  if (!job) return <div className="container">Job not found.</div>;

  const { data: membership } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', job.company_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) return <div className="container">You don&apos;t have access to this job.</div>;

  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, match_score, match_reasoning, ai_summary, created_at, applicant_profiles(full_name, skills, resume_text, resume_url)')
    .eq('job_id', params.jobId)
    .order('match_score', { ascending: false, nullsFirst: false });

  return (
    <div className="container">
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/company" style={{ fontSize: 13, color: 'var(--slate)' }}>← Back to dashboard</Link>
        <div className="eyebrow" style={{ marginTop: 10 }}>{job.location}</div>
        <h1 style={{ fontSize: 24, margin: '4px 0' }}>Applicants — {job.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--slate)' }}>Ranked by AI match score, highest first.</p>
      </div>

      {(!applications || applications.length === 0) && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--slate)' }}>
          No applicants yet for this posting.
        </div>
      )}

      {applications?.map((app: any, i) => {
        const profile = app.applicant_profiles;
        const score = app.match_score;
        const scoreColor = score == null ? 'var(--slate)' : score >= 85 ? 'var(--teal)' : score >= 65 ? 'var(--gold)' : 'var(--rose)';
        return (
          <div key={app.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>#{i + 1} — {profile?.full_name || 'Unnamed applicant'}</div>
                <span className="tagpill" style={{ marginTop: 4, display: 'inline-block' }}>{app.status}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor }}>
                  {score == null ? 'Scoring…' : `${score}%`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--slate)' }}>match score</div>
              </div>
            </div>

            {app.ai_summary && (
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.6 }}>{app.ai_summary}</p>
            )}

            {app.match_reasoning && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4, color: 'var(--teal)' }}>STRENGTHS</div>
                  <ul style={{ fontSize: 12, margin: 0, paddingLeft: 16 }}>
                    {(app.match_reasoning.strengths || []).map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4, color: 'var(--gold)' }}>AREAS TO IMPROVE</div>
                  <ul style={{ fontSize: 12, margin: 0, paddingLeft: 16 }}>
                    {(app.match_reasoning.areas_to_improve || []).map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {profile?.skills?.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.skills.map((s: string) => <span key={s} className="tagpill">{s}</span>)}
              </div>
            )}

            {profile?.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--gold)', display: 'inline-block', marginTop: 10 }}>
                View resume file →
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
