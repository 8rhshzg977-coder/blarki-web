'use client';

import { useState } from 'react';
import { updateApplicationStatus } from './actions';

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

  async function handleChange(newStatus: string) {
    const previous = status;
    setStatus(newStatus);
    setSaving(true);
    const result = await updateApplicationStatus(applicationId, newStatus, jobId);
    setSaving(false);
    if (result?.error) setStatus(previous); // revert on failure
  }

  return (
    <select value={status} disabled={saving} onChange={(e) => handleChange(e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}>
      {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  );
}
