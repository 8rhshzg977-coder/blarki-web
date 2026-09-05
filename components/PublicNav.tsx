import Link from 'next/link';

// Header for pages anyone can see without being logged in (homepage, job
// search, a single job listing) — distinct from the dashboard layouts,
// which assume an authenticated session and show sign-out / notifications.
export default function PublicNav() {
  return (
    <div style={{
      borderBottom: '1px solid var(--line)', padding: '14px 28px', display: 'flex', gap: 22, alignItems: 'center',
      background: 'var(--ink)', color: 'var(--paper)', flexWrap: 'wrap',
    }}>
      <Link href="/" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 19, letterSpacing: '0.01em', color: 'var(--paper)' }}>
        Blarki
      </Link>
      <Link href="/jobs" style={{ color: 'var(--paper)', fontSize: 13.5, opacity: 0.85 }}>Browse jobs</Link>
      <Link href="/companies" style={{ color: 'var(--paper)', fontSize: 13.5, opacity: 0.85 }}>Companies</Link>
      <div style={{ flex: 1 }} />
      <Link href="/login" style={{ color: 'var(--paper)', fontSize: 13.5, opacity: 0.85 }}>Sign in</Link>
      <Link href="/signup?role=company" className="btn-gold" style={{ padding: '8px 16px', fontSize: 13 }}>I&apos;m hiring</Link>
    </div>
  );
}
