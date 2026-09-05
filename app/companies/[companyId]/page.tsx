import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/categories';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

// Public — reachable with no account, same pattern as /jobs/[jobId]. The
// "trust argument" from the PRD: job seekers can see who's actually hiring
// before they apply. Layout takes cues from Indeed/LinkedIn company pages
// (cover + logo header, a stat-chip row, about, photos, then open roles)
// without the parts that need a whole separate system — reviews/ratings,
// a "People" tab, competitor comparisons — which the PRD itself defers to
// a fuller V2 anyway.
export default async function CompanyPage({ params }: { params: { companyId: string } }) {
  const supabase = createClient();

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, description, logo_url, tagline, industry, company_size, headquarters, website_url, cover_url, founded_year, photos')
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

  const stats: { label: string; value: string }[] = [];
  if (company.industry) stats.push({ label: 'Industry', value: company.industry });
  if (company.company_size) stats.push({ label: 'Company size', value: `${company.company_size} employees` });
  if (company.headquarters) stats.push({ label: 'Headquarters', value: company.headquarters });
  if (company.founded_year) stats.push({ label: 'Founded', value: String(company.founded_year) });

  return (
    <div>
      <PublicNav />

      <div style={{
        height: 180, background: company.cover_url ? `url(${company.cover_url}) center/cover` : 'var(--paper-dim)',
        borderBottom: '1px solid var(--line)',
      }} />

      <div className="container" style={{ maxWidth: 780 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', marginTop: -40, marginBottom: 16, flexWrap: 'wrap' }}>
          {company.logo_url ? (
            <img src={company.logo_url} alt={`${company.name} logo`} style={{ width: 88, height: 88, borderRadius: 14, objectFit: 'cover', border: '3px solid var(--paper)', background: 'var(--paper)' }} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: 14, background: 'var(--ink)', border: '3px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: '#fff' }}>
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ paddingBottom: 4 }}>
            <div className="eyebrow">HIRING ON BLARKI</div>
            <h1 style={{ fontSize: 28, margin: '2px 0' }}>{company.name}</h1>
            {company.tagline && <div style={{ fontSize: 14, color: 'var(--slate)' }}>{company.tagline}</div>}
          </div>
        </div>

        {(stats.length > 0 || company.website_url) && (
          <div className="card" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            {stats.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
            {company.website_url && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Website</div>
                <a href={company.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)', marginTop: 2, display: 'inline-block' }}>
                  Visit site ↗
                </a>
              </div>
            )}
          </div>
        )}

        {company.description && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>ABOUT</div>
            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{company.description}</p>
          </div>
        )}

        {company.photos && company.photos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>PHOTOS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {company.photos.map((url: string) => (
                <img key={url} src={url} alt="" style={{ width: 140, height: 140, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--line)' }} />
              ))}
            </div>
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
