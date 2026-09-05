'use client';

import { useState } from 'react';
import { respondToOffer } from './actions';

type OfferStatus = 'pending' | 'accepted' | 'declined';

export default function OfferCard({ offer }: {
  offer: { id: string; jobTitle: string; startDate: string | null; message: string | null; status: OfferStatus };
}) {
  const [status, setStatus] = useState<OfferStatus>(offer.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function respond(accept: boolean) {
    setLoading(true);
    setError('');
    const result = await respondToOffer(offer.id, accept);
    setLoading(false);
    if ('error' in result) { setError(result.error); return; }
    setStatus(result.accepted ? 'accepted' : 'declined');
  }

  const startDateText = offer.startDate
    ? new Date(`${offer.startDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="card" style={{ borderColor: status === 'pending' ? 'var(--gold)' : undefined, borderWidth: status === 'pending' ? 2 : 1 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: 4 }}>OFFER</div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{offer.jobTitle}</div>
      {startDateText && <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 2 }}>Proposed start date: {startDateText}</div>}

      {status === 'pending' && (
        <>
          {offer.message && (
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.6, background: 'var(--paper-dim)', padding: '10px 12px', borderRadius: 8 }}>
              {offer.message}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn-gold" disabled={loading} onClick={() => respond(true)}>
              {loading ? 'Sending…' : 'Accept offer'}
            </button>
            <button className="btn-secondary" disabled={loading} onClick={() => respond(false)}>Decline</button>
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--rose)', marginTop: 8 }}>{error}</div>}
        </>
      )}

      {status === 'declined' && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--slate)' }}>You declined this offer.</div>
      )}

      {status === 'accepted' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, color: 'var(--teal)', fontWeight: 600, marginBottom: 8 }}>
            🎉 Congratulations — you accepted this offer!
          </div>
          {offer.message && (
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, background: 'var(--paper-dim)', padding: '10px 12px', borderRadius: 8, marginBottom: 10 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>FROM THE EMPLOYER</div>
              {offer.message}
            </div>
          )}
          <div className="eyebrow" style={{ marginBottom: 6 }}>TYPICALLY NEXT</div>
          <ul style={{ fontSize: 12.5, color: 'var(--slate)', margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>The employer's HR team will usually follow up directly with onboarding paperwork — tax forms (W-4) and identity/work-eligibility verification (I-9) in the US.</li>
            <li>Keep an eye on the email address on your profile — that's what most employers use to reach you outside Blarki.</li>
            <li>Questions about start date, pay, or logistics go directly to the employer — Blarki isn't involved in your employment itself, just the hiring process.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
