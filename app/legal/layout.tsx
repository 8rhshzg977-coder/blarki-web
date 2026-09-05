import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PublicNav />
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{
          background: 'var(--gold-soft)', border: '1px solid var(--gold)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 28, fontSize: 12.5, color: 'var(--gold-deep)', lineHeight: 1.6,
        }}>
          <strong>Draft — not yet reviewed by an attorney.</strong> This page is a starting point written to
          accurately describe how Blarki actually works today, not a substitute for legal review. Have a
          lawyer review it (and update the placeholders below) before relying on it in production, per the
          product's own requirements doc.
        </div>
        <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.75 }}>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
