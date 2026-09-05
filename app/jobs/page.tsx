import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/categories';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import CompanyChip from '@/components/CompanyChip';

export const dynamic = 'force-dynamic';

// Public job search — no account required. This is the page a shared link,
// a search engine, or someone just curious about what's open on Blarki
// lands on; applying still requires an account, but seeing what's out
// there never should. (Previously, every open role was only visible after
// signing up and landing on /dashboard/applicant.)
export default async function PublicJobsPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const supabase = createClient();

  let query = supabase
    .from('jobs')
    .select('id, title, category, location, pay_range, description, closes_at, company_id, companies(name)')
    .eq('status', 'open')
    .or(`closes_at.is.null,closes_at.gte.${new Date().toISOString().slice(0, 10)}`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`);
  if (searchParams.category) query = query.eq('category', searchParams.category);

  const { data: jobs, error } = await query;

  return (
    <div>
      <PublicNav />
      <div className="container">
        <div className="eyebrow">OPEN ROLES</div>
        <h1 style={{ fontSize: 28, margin: '4px 0 20px' }}>Browse jobs</h1>

        <form method="get" style={{ marginBottom: 16 }}>
          <input name="q" defaultValue={searchParams.q} placeholder="Search job titles — e.g. Nurse, Electrician, Cashier" />
        </form>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <Link href="/jobs" className="tagpill" style={{ padding: '6px 12px' }}>All</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.value} href={`/jobs?category=${c.value}`} className="tagpill" style={{ padding: '6px 12px' }}>{c.label}</Link>
          ))}
        </div>

        {error && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--rose)' }}>
            Could not load jobs right now — please try again in a moment.
          </div>
        )}

        {!error && (!jobs || jobs.length === 0) && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--slate)' }}>No open roles match this search right now.</div>
        )}

        {jobs?.map((job: any) => (
          <div key={job.id} className="card">
            {job.companies?.name && job.company_id && (
              <div><CompanyChip companyId={job.company_id} companyName={job.companies.name} /></div>
            )}
            <Link href={`/jobs/${job.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--slate)' }}>{job.location} · {job.pay_range || 'Pay not listed'}</div>
                </div>
                <span className="tagpill">{CATEGORIES.find((c) => c.value === job.category)?.label || job.category}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>{job.description?.slice(0, 180)}…</p>
            </Link>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
