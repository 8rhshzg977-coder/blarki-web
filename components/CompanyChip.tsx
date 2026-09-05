import Link from 'next/link';

// A clearly-clickable pointer to a company's page, meant to stand out from
// plain card text — feedback was that a small text link blended in and
// job seekers couldn't tell it was tappable. Used on every job card
// (public search, applicant dashboard, saved jobs) so "who's hiring" is
// always one obvious tap away, not just reachable from a job's full detail
// page.
export default function CompanyChip({ companyId, companyName }: { companyId: string; companyName: string }) {
  return (
    <Link
      href={`/companies/${companyId}`}
      className="tagpill"
      style={{
        background: 'var(--gold-soft)', color: 'var(--gold-deep)', marginBottom: 8,
        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700,
      }}
    >
      🏢 {companyName} <span aria-hidden="true">›</span>
    </Link>
  );
}
