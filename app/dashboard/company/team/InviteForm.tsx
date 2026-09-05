'use client';

import { useState } from 'react';
import { inviteTeamMember } from './actions';

export default function InviteForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(''); setSuccess(''); setLoading(true);
    const result = await inviteTeamMember(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
    if (result?.success) { setSuccess('Invite sent.'); (document.getElementById('invite-email') as HTMLInputElement).value = ''; }
  }

  return (
    <div>
      <form action={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input id="invite-email" name="email" type="email" required placeholder="teammate@company.com" style={{ flex: 1 }} />
        <button className="btn-gold" type="submit" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
          {loading ? 'Sending…' : 'Send invite'}
        </button>
      </form>
      {error && <div style={{ fontSize: 12, color: 'var(--rose)', marginTop: 6 }}>{error}</div>}
      {success && <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 6 }}>{success}</div>}
    </div>
  );
}
