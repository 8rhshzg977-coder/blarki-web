'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeTeamMember } from './actions';

export default function RemoveMemberButton({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRemove() {
    setLoading(true);
    const result = await removeTeamMember(memberId);
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    router.refresh();
  }

  if (!confirming) {
    return (
      <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--rose)', borderColor: 'var(--rose)' }} onClick={() => setConfirming(true)}>
        Remove
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button type="button" className="btn-gold" style={{ padding: '4px 10px', fontSize: 12, background: 'var(--rose)', color: '#fff' }} onClick={handleRemove} disabled={loading}>
        {loading ? 'Removing…' : 'Confirm'}
      </button>
      <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirming(false)}>Cancel</button>
      {error && <span style={{ fontSize: 11, color: 'var(--rose)' }}>{error}</span>}
    </div>
  );
}
