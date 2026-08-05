import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions';
import { ensureCompanyMembership } from '@/lib/ensureCompanyMembership';

export default async function CompanyDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let membership;
  try {
    membership = await ensureCompanyMembership(supabase, user.id, user.email || 'you@example.com');
  } catch (err: any) {
    return (
      <div className="container">
        <p>Could not set up your company account: {err.message}</p>
        <p style={{ fontSize: 13, color: 'var(--slate)' }}>Please contact support and mention this error.</p>
      </div>
    );
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, category, location, pay_range, status, created_at, closes_at')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false });

  const jobIds = (jobs || []).map((j) => j.id);
  const { data: applications } = jobIds.length
    ? await supabase.from('applications').select('id, job_id, created_at').in('job_id', jobIds)
    : { data: [] as any[] };

  const applicationsByJob: Record<string, number> = {};
  (applications || []).forEach((a) => { applicationsByJob[a.job_id] = (applicationsByJob[a.job_id] || 0) + 1; });

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const applicationsToday = (applications || []).filter((a) => new Date(a.created_at) >= todayStart).length;
  const openJobsCount = (jobs || []).filter((j) => j.status === 'open').length;
  const now = new Date();
  const jobsNearingClose = (jobs || []).filter((j) => {
    if (!j.closes_at || j.status !== 'open') return false;
    const days = (new Date(j.closes_at).getTime() - now.getTime()) / 86400000;
    return days >= 0 && days <= 7;
  });

  const companyName = (membership as any).companies?.name || 'Your company';

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="eyebrow">{companyName}</div>
          <h1 style={{ fontSize: 26, margin: '4px 0' }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/dashboard/company/new-job" className="btn-gold">+ New job posting</Link>
          <form action={logout}><button className="btn-secondary" type="submit">Sign out</button></form>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{openJobsCount}</div>
          <div style={{ fontSize: 12, color: 'var(--slate)' }}>Open jobs</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{applications?.length || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--slate)' }}>Total applicants</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{applicationsToday}</div>
          <div style={{ fontSize: 12, color: 'var(--slate)' }}>Applications today</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: jobsNearingClose.length ? 'var(--gold)' : undefined }}>{jobsNearingClose.length}</div>
          <div style={{ fontSize: 12, color: 'var(--slate)' }}>Jobs closing within 7 days</div>
        </div>
      </div>

      <div className="eyebrow" style={{ marginBottom: 10 }}>JOB POSTINGS</div>

      {(!jobs || jobs.length === 0) && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--slate)' }}>
          No jobs posted yet — click &quot;New job posting&quot; to create your first one.
        </div>
      )}

      {jobs?.map((job) => (
        <div key={job.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 600 }}>{job.title}</div>
            <div style={{ fontSize: 13, color: 'var(--slate)' }}>{job.location} · {job.pay_range || 'Pay not listed'}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="tagpill">{job.category}</span>
              <span className="tagpill" style={{ background: job.status === 'open' ? 'var(--teal-soft)' : 'var(--rose-soft)', color: job.status === 'open' ? 'var(--teal)' : 'var(--rose)' }}>
                {job.status}
              </span>
              {job.closes_at && <span className="tagpill">Closes {job.closes_at}</span>}
            </div>
          </div>
          <Link href={`/dashboard/company/jobs/${job.id}/applicants`} className="btn-secondary">
            View applicants ({applicationsByJob[job.id] || 0}) →
          </Link>
        </div>
      ))}
    </div>
  );
}
