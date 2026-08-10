import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';

export const maxDuration = 30; // covers the AI scoring call triggered on application submit

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        borderBottom: '1px solid var(--line)', padding: '14px 28px', display: 'flex', gap: 22, alignItems: 'center',
        background: 'var(--ink)', color: 'var(--paper)',
      }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 19, letterSpacing: '0.01em' }}>Blarki</span>
        <Link href="/dashboard/applicant" style={{ color: 'var(--paper)', fontSize: 13.5, opacity: 0.85 }}>Find jobs</Link>
        <Link href="/dashboard/applicant/profile" style={{ color: 'var(--paper)', fontSize: 13.5, opacity: 0.85 }}>My profile</Link>
        <NotificationBell />
      </div>
      {children}
    </div>
  );
}
