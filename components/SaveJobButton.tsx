'use client';

import { useState } from 'react';
import { toggleSavedJob } from '@/app/dashboard/applicant/actions';

export default function SaveJobButton({ jobId, initiallySaved }: { jobId: string; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const prev = saved;
    setSaved(!prev); // optimistic
    const result = await toggleSavedJob(jobId);
    setLoading(false);
    if ('error' in result) { setSaved(prev); return; }
    setSaved(result.saved);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="btn-secondary"
      style={{ padding: '6px 10px', fontSize: 12 }}
      aria-pressed={saved}
      aria-label={saved ? 'Unsave this job' : 'Save this job'}
    >
      {saved ? '★ Saved' : '☆ Save'}
    </button>
  );
}
