'use client';

import { useState } from 'react';
import { updatePassword } from '@/app/actions';

export default function ResetPasswordForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError('');
    const password = String(formData.get('password') || '');
    const confirm = String(formData.get('confirm') || '');
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const result = await updatePassword(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>RESET PASSWORD</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>Set a new password</h1>

      <form action={handleSubmit}>
        <label>New password</label>
        <input name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
        <label>Confirm new password</label>
        <input name="confirm" type="password" required minLength={6} placeholder="Type it again" />
        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 20 }}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
