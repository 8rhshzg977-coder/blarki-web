'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { revokeInvite } from './actions';

export default function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRevoke() {
    setLoading(true);
    const result = await revokeInvite(inviteId);
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleRevoke} disabled={loading}>
        {loading ? 'Revoking…' : 'Revoke'}
      </button>
      {error && <span style={{ fontSize: 11, color: 'var(--rose)' }}>{error}</span>}
    </div>
  );
}
