import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/categories';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

// Public — reachable with no account, same pattern as /jobs/[jobId]. The
// "trust argument" from the PRD: job seekers can see who's actually hiring
// before they apply, not just a bare job title.
export default async function CompanyPage({ params }: { params: { companyId: string } }) {
  const supabase = createClient();

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, description, logo_url')
    .eq('id', params.companyId)
    .maybeSingle();

  if (!company) {
    return (
      <div>
        <PublicNav />
        <div className="container" style={{ maxWidth: 640, textAlign: 'center', paddingTop: 60 }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>This company page isn&apos;t available</h1>
          <Link href="/jobs" className="btn-gold">Browse open jobs</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, category, location, pay_range')
    .eq('company_id', company.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  return (
    <div>
      <PublicNav />
      <div className="container" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          {company.logo_url ? (
            <img src={company.logo_url} alt={`${company.name} logo`} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--line)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--paper-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--slate)' }}>
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="eyebrow">HIRING ON BLARKI</div>
            <h1 style={{ fontSize: 26, margin: '4px 0' }}>{company.name}</h1>
          </div>
        </div>

        {company.description && (
          <div className="card" style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{company.description}</p>
          </div>
        )}

        <div className="eyebrow" style={{ marginBottom: 10 }}>OPEN ROLES ({jobs?.length || 0})</div>
        {(!jobs || jobs.length === 0) && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--slate)' }}>No open roles right now — check back soon.</div>
        )}
        {jobs?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontWeight: 600 }}>{job.title}</div>
            <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 2 }}>{job.location} · {job.pay_range || 'Pay not listed'}</div>
            <span className="tagpill" style={{ marginTop: 8, display: 'inline-block' }}>
              {CATEGORIES.find((c) => c.value === job.category)?.label || job.category}
            </span>
          </Link>
        ))}
      </div>
      <Footer />
    </div>
  );
}
