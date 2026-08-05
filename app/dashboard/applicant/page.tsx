import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions';
import { CATEGORIES } from '@/lib/categories';

export default async function ApplicantDashboard({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let query = supabase
    .from('jobs')
    .select('id, title, category, location, pay_range, description, status')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`);
  if (searchParams.category) query = query.eq('category', searchParams.category);

  const { data: jobs } = await query;

  const { data: myApplications } = await supabase
    .from('applications')
    .select('job_id')
    .eq('applicant_id', (await supabase.from('applicant_profiles').select('id').eq('user_id', user.id).single()).data?.id);

  const appliedJobIds = new Set((myApplications || []).map((a) => a.job_id));
  const categories = CATEGORIES;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">FIND JOBS</div>
          <h1 style={{ fontSize: 26, margin: '4px 0' }}>Roles for you</h1>
        </div>
        <form action={logout}><button className="btn-secondary" type="submit">Sign out</button></form>
      </div>

      <form method="get" style={{ marginBottom: 16 }}>
        <input name="q" defaultValue={searchParams.q} placeholder="Search job titles — e.g. Nurse, Electrician, Cashier" />
      </form>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <Link href="/dashboard/applicant" className="tagpill" style={{ padding: '6px 12px' }}>All</Link>
        {categories.map((c) => (
          <Link key={c.value} href={`/dashboard/applicant?category=${c.value}`} className="tagpill" style={{ padding: '6px 12px' }}>{c.label}</Link>
        ))}
      </div>

      {(!jobs || jobs.length === 0) && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--slate)' }}>No open roles match this search right now.</div>
      )}

      {jobs?.map((job) => (
        <div key={job.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{job.title}</div>
              <div style={{ fontSize: 13, color: 'var(--slate)' }}>{job.location} · {job.pay_range || 'Pay not listed'}</div>
            </div>
            <span className="tagpill">{CATEGORIES.find((c) => c.value === job.category)?.label || job.category}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>{job.description?.slice(0, 180)}…</p>
          {appliedJobIds.has(job.id) ? (
            <span className="tagpill" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>Applied</span>
          ) : (
            <Link href={`/dashboard/applicant/apply/${job.id}`} className="btn-gold" style={{ marginTop: 10, display: 'inline-block' }}>
              Apply — AI screening
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
