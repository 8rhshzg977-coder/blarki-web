import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

// A directory to actually find a company page — previously the only way in
// was clicking through from one specific job's detail page, so job seekers
// had no way to browse companies directly. Lists every company with at
// least one open role.
export default async function CompaniesDirectoryPage() {
  const supabase = createClient();

  const { data: openJobs } = await supabase
    .from('jobs')
    .select('company_id')
    .eq('status', 'open');

  const companyIds = Array.from(new Set((openJobs || []).map((j) => j.company_id)));
  const jobCountByCompany: Record<string, number> = {};
  (openJobs || []).forEach((j) => { jobCountByCompany[j.company_id] = (jobCountByCompany[j.company_id] || 0) + 1; });

  const { data: companies } = companyIds.length
    ? await supabase.from('companies').select('id, name, tagline, logo_url, industry').in('id', companyIds)
    : { data: [] as any[] };

  const sorted = (companies || []).slice().sort((a, b) => (jobCountByCompany[b.id] || 0) - (jobCountByCompany[a.id] || 0));

  return (
    <div>
      <PublicNav />
      <div className="container">
        <div className="eyebrow">COMPANIES HIRING NOW</div>
        <h1 style={{ fontSize: 28, margin: '4px 0 20px' }}>Browse companies</h1>

        {sorted.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--slate)' }}>No companies with open roles right now.</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {sorted.map((c) => (
            <Link key={c.id} href={`/companies/${c.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--paper-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--slate)' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{c.name}</div>
              </div>
              {c.tagline && <div style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 6 }}>{c.tagline}</div>}
              <span className="tagpill">{jobCountByCompany[c.id] || 0} open role{jobCountByCompany[c.id] === 1 ? '' : 's'}</span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
