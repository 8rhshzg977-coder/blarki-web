import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/categories';
import SaveJobButton from '@/components/SaveJobButton';
import CompanyChip from '@/components/CompanyChip';

export const dynamic = 'force-dynamic';

export default async function SavedJobsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: applicantProfile } = await supabase.from('applicant_profiles').select('id').eq('user_id', user.id).single();

  const { data: saved } = applicantProfile
    ? await supabase
        .from('saved_jobs')
        .select('job_id, created_at, jobs(id, title, category, location, pay_range, description, status, closes_at, company_id, companies(name))')
        .eq('applicant_id', applicantProfile.id)
        .order('created_at', { ascending: false })
    : { data: [] as any[] };

  const { data: myApplications } = applicantProfile
    ? await supabase.from('applications').select('job_id').eq('applicant_id', applicantProfile.id)
    : { data: [] as any[] };
  const appliedJobIds = new Set((myApplications || []).map((a) => a.job_id));

  return (
    <div className="container">
      <div className="eyebrow">SAVED</div>
      <h1 style={{ fontSize: 26, margin: '4px 0 20px' }}>Saved jobs</h1>

      {(!saved || saved.length === 0) && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--slate)' }}>
          No saved jobs yet — hit &quot;Save&quot; on a listing from <Link href="/dashboard/applicant" style={{ color: 'var(--gold)', fontWeight: 600 }}>Find jobs</Link> to keep track of it here.
        </div>
      )}

      {saved?.map((s: any) => {
        const job = s.jobs;
        if (!job) return null;
        const isClosed = job.status !== 'open';
        return (
          <div key={s.job_id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                {job.companies?.name && job.company_id && (
                  <CompanyChip companyId={job.company_id} companyName={job.companies.name} />
                )}
                <div style={{ fontWeight: 600 }}>{job.title}</div>
                <div style={{ fontSize: 13, color: 'var(--slate)' }}>{job.location} · {job.pay_range || 'Pay not listed'}</div>
              </div>
              <span className="tagpill">{CATEGORIES.find((c) => c.value === job.category)?.label || job.category}</span>
            </div>
            {isClosed && (
              <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--rose)', fontWeight: 600 }}>
                This posting has closed or been filled.
              </div>
            )}
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>{job.description?.slice(0, 180)}…</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
              {!isClosed && (
                appliedJobIds.has(job.id) ? (
                  <span className="tagpill" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>Applied</span>
                ) : (
                  <Link href={`/dashboard/applicant/apply/${job.id}`} className="btn-gold">Apply — AI screening</Link>
                )
              )}
              <SaveJobButton jobId={job.id} initiallySaved={true} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
