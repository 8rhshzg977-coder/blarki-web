'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signup } from '@/app/actions';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') === 'applicant' ? 'applicant' : 'company');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(''); setSuccess(''); setLoading(true);
    formData.set('role', role);
    const result = await signup(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(result.success);
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>CREATE ACCOUNT</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>Join Blarki</h1>

      <div style={{ display: 'flex', gap: 8, background: 'var(--paper-dim)', padding: 4, borderRadius: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => setRole('company')}
          style={{ flex: 1, padding: 10, borderRadius: 7, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            background: role === 'company' ? 'var(--ink)' : 'transparent', color: role === 'company' ? '#fff' : 'var(--slate)' }}>
          I&apos;m hiring
        </button>
        <button type="button" onClick={() => setRole('applicant')}
          style={{ flex: 1, padding: 10, borderRadius: 7, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            background: role === 'applicant' ? 'var(--ink)' : 'transparent', color: role === 'applicant' ? '#fff' : 'var(--slate)' }}>
          I&apos;m job hunting
        </button>
      </div>

      <form action={handleSubmit}>
        <label>{role === 'company' ? 'Company name' : 'Full name'}</label>
        <input name="name" required placeholder={role === 'company' ? 'e.g. Bright Build Co.' : 'e.g. Maria Alvarez'} />
        <label>Email</label>
        <input name="email" type="email" required placeholder="you@example.com" />
        <label>Password</label>
        <input name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 20 }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="error-box" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>{success}</div>}

      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--slate)' }}>
        Already have an account? <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
