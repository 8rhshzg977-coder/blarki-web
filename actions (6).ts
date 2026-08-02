import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    if (profile?.user_type === 'company_member') redirect('/dashboard/company');
    if (profile?.user_type === 'applicant') redirect('/dashboard/applicant');
  }

  return (
    <div className="container" style={{ maxWidth: 640, textAlign: 'center', paddingTop: 80 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>HIRING, VERIFIED</div>
      <h1 style={{ fontSize: 36, margin: '10px 0 16px' }}>Prove the work before the paperwork.</h1>
      <p style={{ color: 'var(--slate)', marginBottom: 32 }}>
        Skill tests, AI-built screening interviews, and a single explainable fit score.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link href="/signup?role=company" className="btn-primary">I&apos;m hiring</Link>
        <Link href="/signup?role=applicant" className="btn-gold">I&apos;m job hunting</Link>
      </div>
      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--slate)' }}>
        Already have an account? <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
