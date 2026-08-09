import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ScoreRing from '@/components/ScoreRing';

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
    <div>
      <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '70px 28px 90px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ padding: 10, borderRadius: '50%', border: '1px solid rgba(246,245,241,0.18)' }}>
              <div className="score-ring tier-high" style={{ width: 84, height: 84, background: 'radial-gradient(closest-side, var(--ink) 72%, transparent 73% 100%), conic-gradient(var(--teal) 94%, rgba(246,245,241,0.14) 0)' }}>
                <span className="score-value num" style={{ color: 'var(--paper)', fontSize: 20 }}>94</span>
              </div>
            </div>
          </div>
          <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: 12 }}>HIRING, VERIFIED</div>
          <h1 style={{ fontSize: 44, color: 'var(--paper)', marginBottom: 18 }}>
            Every match comes with a reason.
          </h1>
          <p style={{ color: '#B8C0CA', fontSize: 16, lineHeight: 1.6, marginBottom: 36, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            AI screening, resume review, and applicant ranking — every score explained,
            never a black box. Built for construction crews and software teams alike.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup?role=company" className="btn-gold">I&apos;m hiring</Link>
            <Link href="/signup?role=applicant" className="btn-secondary" style={{ borderColor: 'rgba(246,245,241,0.3)', color: 'var(--paper)' }}>I&apos;m job hunting</Link>
          </div>
          <p style={{ marginTop: 26, fontSize: 13, color: '#8A94A0' }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 760, paddingTop: 56, paddingBottom: 20 }}>
        <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 10 }}>NOT JUST LISTINGS</div>
        <h2 style={{ fontSize: 26, textAlign: 'center', marginBottom: 14 }}>
          Blarki learns the candidate, not just the resume.
        </h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.7, textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          Every job seeker gets more than a search bar. Blarki builds a real picture of what
          you&apos;re good at, what you want to do next, and where the gaps are — then surfaces
          the roles that actually fit, and explains what would make you a stronger candidate
          for the ones that don&apos;t yet. You&apos;re always free to apply anywhere; the matching
          just makes it easier to find and be found by the right opportunities faster.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 760, paddingTop: 36, paddingBottom: 56 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 28, textAlign: 'center' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>FOR EMPLOYERS</div>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Post a role, get AI-tailored screening questions, and see applicants ranked
              with a reason attached to every score.
            </p>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>FOR JOB SEEKERS</div>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Upload a resume, get real AI feedback on your strengths and gaps, and see
              exactly why a role fits — or what would help it fit better.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
