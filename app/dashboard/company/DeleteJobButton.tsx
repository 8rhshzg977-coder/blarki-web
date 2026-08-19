'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteJob } from './actions';

export default function DeleteJobButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteJob(jobId);
    setDeleting(false);
    if (result?.error) { setError(result.error); return; }
    router.refresh();
  }

  if (!confirming) {
    return (
      <button type="button" className="btn-secondary" style={{ color: 'var(--rose)', borderColor: 'var(--rose)' }} onClick={() => setConfirming(true)}>
        Delete
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--rose)' }}>Delete &quot;{jobTitle}&quot; and all its applicants?</span>
      <button type="button" className="btn-gold" style={{ background: 'var(--rose)', color: '#fff', padding: '6px 12px', fontSize: 12 }} onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Confirm delete'}
      </button>
      <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setConfirming(false)}>Cancel</button>
      {error && <span style={{ fontSize: 12, color: 'var(--rose)' }}>{error}</span>}
    </div>
  );
}
