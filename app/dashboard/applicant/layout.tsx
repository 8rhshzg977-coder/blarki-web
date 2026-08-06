import Link from 'next/link';

export const maxDuration = 30; // covers the AI scoring call triggered on application submit

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--line)', padding: '14px 24px', display: 'flex', gap: 20, alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontFamily: 'serif' }}>Blarki</span>
        <Link href="/dashboard/applicant">Find jobs</Link>
        <Link href="/dashboard/applicant/profile">My profile</Link>
      </div>
      {children}
    </div>
  );
}
