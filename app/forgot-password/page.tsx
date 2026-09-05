'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(''); setSuccess(''); setLoading(true);
    const result = await requestPasswordReset(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(result.success);
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>RESET PASSWORD</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>Forgot your password?</h1>
      <p style={{ fontSize: 13.5, color: 'var(--slate)', marginBottom: 20 }}>
        Enter the email you signed up with and we'll send you a link to set a new password.
      </p>

      {!success && (
        <form action={handleSubmit}>
          <label>Email</label>
          <input name="email" type="email" required placeholder="you@example.com" />
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 20 }}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      {error && <div className="error-box">{error}</div>}
      {success && <div className="error-box" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>{success}</div>}

      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--slate)' }}>
        <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>Back to sign in</Link>
      </p>
    </div>
  );
}
