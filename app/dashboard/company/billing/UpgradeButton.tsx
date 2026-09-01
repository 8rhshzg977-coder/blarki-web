'use client';

import { useState } from 'react';

export default function UpgradeButton({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpgrade() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setError(data.error || 'Could not start checkout.');
    } catch (err: any) {
      setError('Could not start checkout — please try again.');
    }
    setLoading(false);
  }

  return (
    <div>
      <button className="btn-gold" onClick={handleUpgrade} disabled={loading}>
        {loading ? 'Loading…' : 'Upgrade'}
      </button>
      {error && <div style={{ fontSize: 12, color: 'var(--rose)', marginTop: 6, maxWidth: 160 }}>{error}</div>}
    </div>
  );
}
