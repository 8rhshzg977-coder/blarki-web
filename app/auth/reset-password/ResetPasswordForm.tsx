'use client';

import { useState } from 'react';
import { updatePassword } from '@/app/actions';

export default function ResetPasswordForm({ welcomeToCompany }: { welcomeToCompany: string | null }) {
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
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>
        {welcomeToCompany ? 'CLAIM YOUR ACCOUNT' : 'RESET PASSWORD'}
      </div>
      <h1 style={{ fontSize: 26, margin: welcomeToCompany ? '8px 0 8px' : '8px 0 20px' }}>
        {welcomeToCompany ? `Welcome to ${welcomeToCompany}` : 'Set a new password'}
      </h1>
      {welcomeToCompany && (
        <p style={{ fontSize: 13.5, color: 'var(--slate)', marginBottom: 20 }}>
          You've been added as an HR Manager. Set a password below to finish claiming your account.
        </p>
      )}

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
