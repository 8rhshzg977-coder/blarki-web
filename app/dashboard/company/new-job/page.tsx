'use client';

import { useState } from 'react';
import { publishJob } from '@/app/dashboard/company/actions';
import { CATEGORIES } from '@/lib/categories';

export default function NewJobPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('retail');
  const [location, setLocation] = useState('');
  const [payRange, setPayRange] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [requirements, setRequirements] = useState('');
  const [context, setContext] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<{ text: string; type: 'text' | 'yes_no' }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  async function generate() {
    setError(''); setGenerating(true);
    try {
      const res = await fetch('/api/generate-job-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, location, payRange, requirements, context }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Generation failed.'); setGenerating(false); return; }
      setDescription(data.description);
      setQuestions((data.questions || []).map((q: any) => typeof q === 'string' ? { text: q, type: 'text' } : q));
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    }
    setGenerating(false);
  }

  async function handlePublish(formData: FormData) {
    setPublishing(true);
    formData.set('questions', JSON.stringify(questions));
    formData.set('closesAt', closesAt);
    const result = await publishJob(formData);
    setPublishing(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>NEW JOB POSTING</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>{step === 1 ? 'Basics' : 'Description & questions'}</h1>

      {step === 1 && (
        <div className="card">
          <label>Job title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Civil Engineer" />
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Houston, TX" />
          <label>Pay range (optional)</label>
          <input value={payRange} onChange={(e) => setPayRange(e.target.value)} placeholder="e.g. $70k-$90k/yr" />
          <label>Applications close <span style={{ color: 'var(--rose)' }}>*</span> (required)</label>
          <input type="date" required value={closesAt} onChange={(e) => setClosesAt(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>
            This job automatically comes down and stops accepting applicants on this date — no stale listings.
          </div>
          <label>Must-have requirements</label>
          <textarea rows={3} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
          <label>Anything else the AI should know?</label>
          <textarea rows={2} value={context} onChange={(e) => setContext(e.target.value)} />
          <button className="btn-primary" style={{ marginTop: 16 }} disabled={!title || !closesAt || generating} onClick={generate}>
            {generating ? 'Generating…' : 'Next: AI description & questions →'}
          </button>
        </div>
      )}

      {step === 2 && (
        <form action={handlePublish}>
          <input type="hidden" name="title" value={title} />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="location" value={location} />
          <input type="hidden" name="payRange" value={payRange} />
          <div className="card">
            <label>Description (edit freely)</label>
            <textarea rows={8} name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <label>Screening questions (edit freely)</label>
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
            <button type="button" className="btn-secondary" onClick={() => setQuestions([...questions, { text: '', type: 'text' }])}>+ Add a question</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-gold" type="submit" disabled={publishing}>{publishing ? 'Publishing…' : 'Publish job posting'}</button>
            </div>
          </div>
        </form>
      )}

      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
