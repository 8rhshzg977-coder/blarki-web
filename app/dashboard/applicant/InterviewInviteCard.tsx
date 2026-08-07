'use client';

import { useState } from 'react';
import { respondToInterview } from './actions';

export default function InterviewInviteCard({ invite }: { invite: any }) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [prepInfo, setPrepInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function respond(accept: boolean) {
    setLoading(true);
    const result = await respondToInterview(invite.id, accept);
    setLoading(false);
    if (result?.error) return;
    if (result?.accepted) {
      setStatus('accepted');
      setPrepInfo(result.prepInfo || '');
    } else {
      setStatus('declined');
    }
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 600 }}>{invite.jobTitle}</div>
      <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 2 }}>
        Interview requested for {new Date(invite.confirmed_slot).toLocaleString()}
      </div>

      {status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn-gold" disabled={loading} onClick={() => respond(true)}>
            {loading ? 'Sending…' : 'Accept'}
          </button>
          <button className="btn-secondary" disabled={loading} onClick={() => respond(false)}>Decline</button>
        </div>
      )}

      {status === 'declined' && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--slate)' }}>You declined this interview.</div>
      )}

      {status === 'accepted' && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, marginBottom: 6 }}>Interview confirmed</div>
          {prepInfo && (
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', whiteSpace: 'pre-line', background: 'var(--paper-dim)', padding: '10px 12px', borderRadius: 8 }}>
              {prepInfo}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
