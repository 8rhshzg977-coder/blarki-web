'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/app/actions';

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(decodeURIComponent(urlError.replace(/\+/g, ' ')));
  }, [searchParams]);

  async function handleSubmit(formData: FormData) {
    setError(''); setLoading(true);
    const result = await login(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>SIGN IN</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>Welcome back</h1>

      <form action={handleSubmit}>
        <label>Email</label>
        <input name="email" type="email" required placeholder="you@example.com" />
        <label>Password</label>
        <input name="password" type="password" required placeholder="Your password" />
        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 20 }}>
          {loading ? 'Signing in…' : 'Continue'}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}

      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--slate)' }}>
        No account yet? <Link href="/signup" style={{ color: 'var(--gold)', fontWeight: 600 }}>Create one</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
