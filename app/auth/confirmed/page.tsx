import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function ConfirmedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let destination = '/login';
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single();
    destination = profile?.user_type === 'company_member' ? '/dashboard/company' : '/dashboard/applicant';
  }

  return (
    <div className="container" style={{ maxWidth: 420, textAlign: 'center', paddingTop: 90 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: 'var(--teal-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26, color: 'var(--teal)',
      }}>
        ✓
      </div>
      <h1 style={{ fontSize: 24, marginBottom: 10 }}>Your email is confirmed</h1>
      <p style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 24 }}>
        {user ? "You're signed in — your account is ready to go." : 'You can now sign in with your email and password.'}
      </p>
      <Link href={destination} className="btn-gold">
        {user ? 'Continue to Blarki' : 'Go to sign in'}
      </Link>
    </div>
  );
}
