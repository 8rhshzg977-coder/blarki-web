import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions';

export default async function CompanyDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, role, companies(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="container">
        <p>Setting up your company… if this doesn&apos;t resolve, refresh the page.</p>
      </div>
    );
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, category, location, pay_range, status, created_at')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false });

  const companyName = (membership as any).companies?.name || 'Your company';

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="eyebrow">{companyName}</div>
          <h1 style={{ fontSize: 26, margin: '4px 0' }}>Job postings</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/dashboard/company/new-job" className="btn-gold">+ New job posting</Link>
          <form action={logout}><button className="btn-secondary" type="submit">Sign out</button></form>
        </div>
      </div>

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
            <span className="tagpill" style={{ marginTop: 6, display: 'inline-block' }}>{job.category}</span>
            <span className="tagpill" style={{ background: job.status === 'open' ? 'var(--teal-soft)' : 'var(--rose-soft)', color: job.status === 'open' ? 'var(--teal)' : 'var(--rose)' }}>
              {job.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
