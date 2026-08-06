'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { submitApplication } from '@/app/dashboard/applicant/actions';

function ApplyForm({ jobId }: { jobId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [job, setJob] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const draftKey = `blarki-apply-draft-${jobId}`;

  useEffect(() => {
    (async () => {
      const { data: jobData } = await supabase.from('jobs').select('id, title, location, description').eq('id', jobId).single();
      const { data: qData } = await supabase.from('screening_questions').select('id, question_text, answer_type').eq('job_id', jobId).order('order_index');
      setJob(jobData);
      setQuestions(qData || []);

      // Restore any in-progress answers so switching tabs/pages doesn't lose them
      try {
        const saved = sessionStorage.getItem(draftKey);
        if (saved) setAnswers(JSON.parse(saved));
      } catch {}
    })();
  }, [jobId]);

  function updateAnswer(questionId: string, value: string) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    try { sessionStorage.setItem(draftKey, JSON.stringify(next)); } catch {}
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    const result = await submitApplication(formData);
    if (result?.success) {
      try { sessionStorage.removeItem(draftKey); } catch {}
      router.push('/dashboard/applicant');
      return;
    }
    // If we're still here without a thrown redirect, something unexpected
    // happened server-side that didn't come back as a normal error redirect.
    setSubmitting(false);
  }

  if (!job) return <div className="container">Loading…</div>;

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <div className="eyebrow">{job.location}</div>
      <h1 style={{ fontSize: 24, margin: '4px 0 20px' }}>{job.title}</h1>

      {urlError && <div className="error-box" style={{ marginBottom: 16 }}>{decodeURIComponent(urlError.replace(/\+/g, ' '))}</div>}

      <form action={handleSubmit}>
        <input type="hidden" name="jobId" value={job.id} />
        <div className="card">
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 14 }}>
              <label>{q.question_text}</label>
              {q.answer_type === 'yes_no' ? (
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                    <input type="radio" name={`answer-${q.id}`} value="Yes" style={{ width: 'auto' }}
                      checked={answers[q.id] === 'Yes'} onChange={() => updateAnswer(q.id, 'Yes')} /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                    <input type="radio" name={`answer-${q.id}`} value="No" style={{ width: 'auto' }}
                      checked={answers[q.id] === 'No'} onChange={() => updateAnswer(q.id, 'No')} /> No
                  </label>
                </div>
              ) : (
                <textarea rows={2} name={`answer-${q.id}`} value={answers[q.id] || ''}
                  onChange={(e) => updateAnswer(q.id, e.target.value)} />
              )}
            </div>
          ))}
          <button className="btn-gold" type="submit" disabled={submitting} style={{ marginTop: 6 }}>
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ApplyPage({ params }: { params: { jobId: string } }) {
  return (
    <Suspense fallback={<div className="container">Loading…</div>}>
      <ApplyForm jobId={params.jobId} />
    </Suspense>
  );
}
