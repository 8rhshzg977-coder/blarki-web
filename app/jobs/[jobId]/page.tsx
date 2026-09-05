import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/categories';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import SaveJobButton from '@/components/SaveJobButton';

export const dynamic = 'force-dynamic';

// Public job detail — reachable with no account. RLS on `jobs` already
// restricts anonymous/other-company reads to status = 'open', so a closed
// or unknown id naturally comes back empty here; no extra filtering needed.
export default async function PublicJobPage({ params }: { params: { jobId: string } }) {
  const supabase = createClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, category, location, pay_range, description, closes_at, status, companies(name)')
    .eq('id', params.jobId)
    .maybeSingle();

  if (!job) {
    return (
      <div>
        <PublicNav />
        <div className="container" style={{ maxWidth: 640, textAlign: 'center', paddingTop: 60 }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>This job isn&apos;t available</h1>
          <p style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 20 }}>
            It may have closed or been filled since you found this link.
          </p>
          <Link href="/jobs" className="btn-gold">Browse open jobs</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const applyPath = `/dashboard/applicant/apply/${job.id}`;
  const redirectParam = `redirect=${encodeURIComponent(applyPath)}`;

  const { data: { user } } = await supabase.auth.getUser();
  let cta = <Link href={`/signup?role=applicant&${redirectParam}`} className="btn-gold">Apply — create a free account</Link>;
  let signInHint = (
    <p style={{ fontSize: 12.5, color: 'var(--slate)', marginTop: 10 }}>
      Already have an account? <Link href={`/login?${redirectParam}`} style={{ color: 'var(--gold)', fontWeight: 600 }}>Sign in</Link>
    </p>
  );

  let saveButton = <></>;

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single();
    if (profile?.user_type === 'company_member') {
      cta = <div className="tagpill">Signed in as an employer — switch to an applicant account to apply</div>;
      signInHint = <></>;
    } else {
      const { data: applicantProfile } = await supabase.from('applicant_profiles').select('id').eq('user_id', user.id).single();
      const { data: existingApplication } = applicantProfile
        ? await supabase.from('applications').select('id').eq('job_id', job.id).eq('applicant_id', applicantProfile.id).maybeSingle()
        : { data: null };
      cta = existingApplication
        ? <span className="tagpill" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>You&apos;ve already applied</span>
        : <Link href={applyPath} className="btn-gold">Apply — AI screening</Link>;
      signInHint = <></>;
      if (applicantProfile) {
        const { data: existingSave } = await supabase.from('saved_jobs').select('id').eq('job_id', job.id).eq('applicant_id', applicantProfile.id).maybeSingle();
        saveButton = <SaveJobButton jobId={job.id} initiallySaved={Boolean(existingSave)} />;
      }
    }
  }

  return (
    <div>
      <PublicNav />
      <div className="container" style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/jobs" style={{ fontSize: 13, color: 'var(--slate)' }}>← Back to all jobs</Link>
        </div>

        <div className="eyebrow">{(job as any).companies?.name || 'A company on Blarki'}</div>
        <h1 style={{ fontSize: 28, margin: '4px 0 12px' }}>{job.title}</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <span className="tagpill">{CATEGORIES.find((c) => c.value === job.category)?.label || job.category}</span>
          {job.location && <span className="tagpill">{job.location}</span>}
          {job.pay_range && <span className="tagpill">{job.pay_range}</span>}
          {job.closes_at && <span className="tagpill">Applications close {job.closes_at}</span>}
        </div>

        <div className="card">
          <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{job.description}</p>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {cta}
          {saveButton}
        </div>
        {signInHint}
      </div>
      <Footer />
    </div>
  );
}
