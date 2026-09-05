import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions';
import { CATEGORIES } from '@/lib/categories';
import InterviewInviteCard from './InterviewInviteCard';
import OfferCard from './OfferCard';
import ProfileCompletionCard from '@/components/ProfileCompletionCard';
import { getProfileCompletion } from '@/lib/profileCompletion';
import SaveJobButton from '@/components/SaveJobButton';

export const dynamic = 'force-dynamic';

export default async function ApplicantDashboard({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let query = supabase
    .from('jobs')
    .select('id, title, category, location, pay_range, description, status, closes_at, company_id, companies(name)')
    .eq('status', 'open')
    .or(`closes_at.is.null,closes_at.gte.${new Date().toISOString().slice(0, 10)}`)
    .order('created_at', { ascending: false });

  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`);
  if (searchParams.category) query = query.eq('category', searchParams.category);

  const { data: jobs } = await query;

  const { data: applicantProfile } = await supabase
    .from('applicant_profiles')
    .select('id, full_name, resume_text, resume_url, skills, bio, location, portfolio_url, linkedin_url, availability')
    .eq('user_id', user.id)
    .single();

  const { data: myApps } = applicantProfile
    ? await supabase.from('applications').select('id, job_id, jobs(title)').eq('applicant_id', applicantProfile.id)
    : { data: [] as any[] };

  const appliedJobIds = new Set((myApps || []).map((a) => a.job_id));
  const categories = CATEGORIES;

  const { data: savedJobs } = applicantProfile
    ? await supabase.from('saved_jobs').select('job_id').eq('applicant_id', applicantProfile.id)
    : { data: [] as any[] };
  const savedJobIds = new Set((savedJobs || []).map((s) => s.job_id));

  let pendingInvites: any[] = [];
  let offerCards: any[] = [];
  const appIds = (myApps || []).map((a) => a.id);
  if (appIds.length) {
    const { data: invites } = await supabase
      .from('interviews')
      .select('id, confirmed_slot, application_id, confirmation_status')
      .in('application_id', appIds)
      .eq('confirmation_status', 'awaiting_response');
    pendingInvites = (invites || []).map((inv) => ({
      ...inv,
      jobTitle: ((myApps || []).find((a) => a.id === inv.application_id)?.jobs as any)?.title || 'a role',
    }));

    // Offers table may not exist yet on a database that hasn't run
    // supabase/migrations/0004_offers.sql — fail quietly here rather than
    // breaking the whole dashboard over a feature that hasn't been set up.
    const { data: offers } = await supabase
      .from('offers')
      .select('id, application_id, start_date, message, status')
      .in('application_id', appIds)
      .neq('status', 'declined');
    offerCards = (offers || []).map((o: any) => ({
      id: o.id,
      jobTitle: ((myApps || []).find((a) => a.id === o.application_id)?.jobs as any)?.title || 'a role',
      startDate: o.start_date,
      message: o.message,
      status: o.status,
    }));
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">FIND JOBS</div>
          <h1 style={{ fontSize: 26, margin: '4px 0' }}>Roles for you</h1>
        </div>
        <form action={logout}><button className="btn-secondary" type="submit">Sign out</button></form>
      </div>

      {getProfileCompletion(applicantProfile).percent < 100 && (
        <div style={{ marginBottom: 24 }}>
          <ProfileCompletionCard profile={applicantProfile} />
          <Link href="/dashboard/applicant/profile" style={{ fontSize: 12.5, color: 'var(--gold)', fontWeight: 600 }}>
            Finish your profile →
          </Link>
        </div>
      )}

      {offerCards.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {offerCards.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>INTERVIEW INVITATIONS</div>
          {pendingInvites.map((inv) => <InterviewInviteCard key={inv.id} invite={inv} />)}
        </div>
      )}

      <form method="get" style={{ marginBottom: 16 }}>
        <input name="q" defaultValue={searchParams.q} placeholder="Search job titles — e.g. Nurse, Electrician, Cashier" />
      </form>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <Link href="/dashboard/applicant" className="tagpill" style={{ padding: '6px 12px' }}>All</Link>
        {categories.map((c) => (
          <Link key={c.value} href={`/dashboard/applicant?category=${c.value}`} className="tagpill" style={{ padding: '6px 12px' }}>{c.label}</Link>
        ))}
      </div>

      {(!jobs || jobs.length === 0) && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--slate)' }}>No open roles match this search right now.</div>
      )}

      {jobs?.map((job: any) => (
        <div key={job.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              {job.companies?.name && job.company_id && (
                <Link href={`/companies/${job.company_id}`} style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, display: 'inline-block', marginBottom: 2 }}>
                  {job.companies.name}
                </Link>
              )}
              <div style={{ fontWeight: 600 }}>{job.title}</div>
              <div style={{ fontSize: 13, color: 'var(--slate)' }}>{job.location} · {job.pay_range || 'Pay not listed'}</div>
            </div>
            <span className="tagpill">{CATEGORIES.find((c) => c.value === job.category)?.label || job.category}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>{job.description?.slice(0, 180)}…</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
            {appliedJobIds.has(job.id) ? (
              <span className="tagpill" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>Applied</span>
            ) : (
              <Link href={`/dashboard/applicant/apply/${job.id}`} className="btn-gold">Apply — AI screening</Link>
            )}
            <SaveJobButton jobId={job.id} initiallySaved={savedJobIds.has(job.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}
