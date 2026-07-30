import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { submitApplication } from '@/app/dashboard/applicant/actions';

export default async function ApplyPage({ params }: { params: { jobId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, location, description')
    .eq('id', params.jobId)
    .single();

  const { data: questions } = await supabase
    .from('screening_questions')
    .select('id, question_text')
    .eq('job_id', params.jobId)
    .order('order_index');

  if (!job) return <div className="container">Job not found.</div>;

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <div className="eyebrow">{job.location}</div>
      <h1 style={{ fontSize: 24, margin: '4px 0 20px' }}>{job.title}</h1>
      <form action={submitApplication}>
        <input type="hidden" name="jobId" value={job.id} />
        <div className="card">
          {questions?.map((q) => (
            <div key={q.id}>
              <label>{q.question_text}</label>
              <textarea rows={2} name={`answer-${q.id}`} />
            </div>
          ))}
          <button className="btn-gold" type="submit" style={{ marginTop: 16 }}>Submit application</button>
        </div>
      </form>
    </div>
  );
}
