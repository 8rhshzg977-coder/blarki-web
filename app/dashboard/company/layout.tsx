import Link from 'next/link';

export const maxDuration = 30;

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        borderBottom: '1px solid var(--line)', padding: '14px 28px', display: 'flex', gap: 22, alignItems: 'center',
        background: 'var(--ink)', color: 'var(--paper)',
      }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 19, letterSpacing: '0.01em' }}>Blarki</span>
        <Link href="/dashboard/company" style={{ color: 'var(--paper)', fontSize: 13.5, opacity: 0.85 }}>Dashboard</Link>
        <Link href="/dashboard/company/new-job" style={{ color: 'var(--paper)', fontSize: 13.5, opacity: 0.85 }}>+ New job</Link>
      </div>
      {children}
    </div>
  );
}
