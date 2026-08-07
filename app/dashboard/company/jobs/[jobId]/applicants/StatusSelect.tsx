'use client';

import { useState } from 'react';
import { updateApplicationStatus, scheduleInterview } from './actions';

const STAGES = [
  { value: 'applied', label: 'Applied' },
  { value: 'ai_resume_review', label: 'AI resume review' },
  { value: 'recruiter_review', label: 'Recruiter review' },
  { value: 'hiring_manager_review', label: 'Hiring manager review' },
  { value: 'interview_requested', label: 'Interview requested' },
  { value: 'interview_scheduled', label: 'Interview scheduled' },
  { value: 'interview_completed', label: 'Interview completed' },
  { value: 'final_decision', label: 'Final decision' },
  { value: 'offer_sent', label: 'Offer sent' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

export default function StatusSelect({ applicationId, jobId, currentStatus }: { applicationId: string; jobId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [message, setMessage] = useState('');

  async function handleChange(newStatus: string) {
    if (newStatus === 'interview_requested') {
      setShowScheduler(true);
      return;
    }
    const previous = status;
    setStatus(newStatus);
    setSaving(true);
    const result = await updateApplicationStatus(applicationId, newStatus, jobId);
    setSaving(false);
    if (result?.error) setStatus(previous);
  }

  async function sendInvite() {
    if (!interviewDate || !interviewTime) { setMessage('Pick a date and time first.'); return; }
    setSaving(true);
    const iso = new Date(`${interviewDate}T${interviewTime}`).toISOString();
    const result = await scheduleInterview(applicationId, jobId, iso);
    setSaving(false);
    if (result?.error) { setMessage(result.error); return; }
    setStatus('interview_requested');
    setShowScheduler(false);
    setMessage('Invite sent — the applicant has been notified.');
  }

  return (
    <div>
      <select value={status} disabled={saving} onChange={(e) => handleChange(e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}>
        {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {showScheduler && (
        <div style={{ marginTop: 8, padding: 10, background: 'var(--paper-dim)', borderRadius: 8, fontSize: 12 }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Propose an interview time</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} style={{ fontSize: 12, padding: 6 }} />
            <input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} style={{ fontSize: 12, padding: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn-gold" style={{ padding: '5px 10px', fontSize: 12 }} onClick={sendInvite} disabled={saving}>
              {saving ? 'Sending…' : 'Send invite'}
            </button>
            <button type="button" className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setShowScheduler(false)}>Cancel</button>
          </div>
        </div>
      )}

      {message && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--slate)' }}>{message}</div>}
    </div>
  );
}
