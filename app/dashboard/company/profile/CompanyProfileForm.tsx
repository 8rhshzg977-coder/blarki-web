'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateCompanyProfile } from './actions';

type Company = { id: string; name: string; description: string | null; logo_url: string | null };

export default function CompanyProfileForm({ company }: { company: Company }) {
  const supabase = createClient();
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description || '');
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Logo must be an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2MB.'); return; }

    setUploading(true); setError('');
    const path = `${company.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage.from('company-logos').upload(path, file);
    setUploading(false);
    if (uploadError) { setError('Upload failed: ' + uploadError.message); return; }
    const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true); setMessage(''); setError('');
    formData.set('logoUrl', logoUrl);
    const result = await updateCompanyProfile(formData);
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    setMessage('Saved.');
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>COMPANY PROFILE</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 6px' }}>Your company page</h1>
      <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 20 }}>
        Job seekers see this before they apply — a logo and a real description build trust.{' '}
        <Link href={`/companies/${company.id}`} style={{ color: 'var(--gold)', fontWeight: 600 }}>View public page →</Link>
      </p>

      <form action={handleSubmit}>
        <div className="card">
          <label>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--line)' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 10, background: 'var(--paper-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--slate)', textAlign: 'center' }}>
                No logo
              </div>
            )}
            <div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} style={{ fontSize: 12 }} />
              {uploading && <div style={{ fontSize: 11.5, color: 'var(--slate)', marginTop: 4 }}>Uploading…</div>}
            </div>
          </div>

          <label>Company name</label>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} required />

          <label>About your company</label>
          <textarea
            rows={6}
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What you do, what it's like to work there, what makes this a good place to build a career."
          />

          <button className="btn-gold" type="submit" disabled={saving || uploading} style={{ marginTop: 16 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {message && <div className="error-box" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>{message}</div>}
      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
