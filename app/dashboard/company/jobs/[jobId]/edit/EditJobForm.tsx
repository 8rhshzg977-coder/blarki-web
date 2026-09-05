'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateJob } from '@/app/dashboard/company/actions';
import { CATEGORIES } from '@/lib/categories';

type Question = { text: string; type: 'text' | 'yes_no' };

export default function EditJobForm({
  job,
  initialQuestions,
}: {
  job: { id: string; title: string; category: string; location: string | null; pay_range: string | null; closes_at: string; description: string | null; status: string };
  initialQuestions: Question[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(job.title);
  const [category, setCategory] = useState(job.category);
  const [location, setLocation] = useState(job.location || '');
  const [payRange, setPayRange] = useState(job.pay_range || '');
  const [closesAt, setClosesAt] = useState(job.closes_at);
  const [description, setDescription] = useState(job.description || '');
  const [status, setStatus] = useState(job.status);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setSaving(true); setError('');
    formData.set('questions', JSON.stringify(questions));
    formData.set('status', status);
    const result = await updateJob(job.id, formData);
    setSaving(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>EDIT JOB POSTING</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>{job.title}</h1>

      <form action={handleSubmit}>
        <div className="card">
          <label>Job title</label>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>Category</label>
          <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <label>Location</label>
          <input name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Houston, TX" />

          <label>Pay range (optional)</label>
          <input name="payRange" value={payRange} onChange={(e) => setPayRange(e.target.value)} placeholder="e.g. $70k-$90k/yr" />

          <label>Applications close <span style={{ color: 'var(--rose)' }}>*</span></label>
          <input type="date" name="closesAt" required value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />

          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open — accepting applicants</option>
            <option value="closed">Closed — stop accepting applicants</option>
          </select>
          <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>
            Closing early hides this posting from search immediately. Reopening clears any auto-close.
          </div>

          <label style={{ marginTop: 12 }}>Description</label>
          <textarea rows={8} name="description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <label>Screening questions</label>
          {questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <textarea rows={2} style={{ flex: 1 }} value={q.text}
                onChange={(e) => setQuestions(questions.map((qq, ii) => ii === i ? { ...qq, text: e.target.value } : qq))} />
              <select style={{ width: 110 }} value={q.type}
                onChange={(e) => setQuestions(questions.map((qq, ii) => ii === i ? { ...qq, type: e.target.value as 'text' | 'yes_no' } : qq))}>
                <option value="text">Open answer</option>
                <option value="yes_no">Yes / No</option>
              </select>
              <button type="button" className="btn-secondary" onClick={() => setQuestions(questions.filter((_, ii) => ii !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => setQuestions([...questions, { text: '', type: 'text' }])}>
            + Add a question
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
            <button type="button" className="btn-secondary" onClick={() => router.push('/dashboard/company')}>← Back</button>
            <button className="btn-gold" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      </form>

      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
