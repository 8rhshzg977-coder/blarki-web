'use client';

import { useState } from 'react';

// Sends the company owner to Stripe's hosted portal — the only place plan
// downgrades, cancellations, and payment-method updates actually happen.
// UpgradeButton (in this same folder) only ever moves someone up a tier;
// this is the way back down or out.
export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleManage() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
        return;
      }
      setError(data.error || 'Could not open the billing portal.');
    } catch (err: any) {
      setError('Could not open the billing portal — please try again.');
    }
    setLoading(false);
  }

  return (
    <div>
      <button className="btn-secondary" onClick={handleManage} disabled={loading}>
        {loading ? 'Loading…' : 'Manage billing / cancel'}
      </button>
      {error && <div style={{ fontSize: 12, color: 'var(--rose)', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
