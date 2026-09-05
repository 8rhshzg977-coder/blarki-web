import Link from 'next/link';

export default function Footer() {
  return (
    <div style={{ borderTop: '1px solid var(--line)', marginTop: 40, padding: '24px 28px', display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', fontSize: 12.5, color: 'var(--slate)' }}>
      <span>© {new Date().getFullYear()} Blarki</span>
      <Link href="/legal/terms" style={{ color: 'var(--slate)' }}>Terms of Service</Link>
      <Link href="/legal/privacy" style={{ color: 'var(--slate)' }}>Privacy Policy</Link>
      <Link href="/legal/cookies" style={{ color: 'var(--slate)' }}>Cookie Policy</Link>
      <Link href="/legal/acceptable-use" style={{ color: 'var(--slate)' }}>Acceptable Use</Link>
    </div>
  );
}
