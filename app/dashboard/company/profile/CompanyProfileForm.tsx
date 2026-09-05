'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateCompanyProfile } from './actions';

type Company = {
  id: string; name: string; description: string | null; logo_url: string | null;
  tagline: string | null; industry: string | null; company_size: string | null;
  headquarters: string | null; website_url: string | null; cover_url: string | null;
  founded_year: number | null; photos: string[] | null;
};

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1,000', '1,001-5,000', '5,000+'];

export default function CompanyProfileForm({ company }: { company: Company }) {
  const supabase = createClient();
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description || '');
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(company.cover_url || '');
  const [tagline, setTagline] = useState(company.tagline || '');
  const [industry, setIndustry] = useState(company.industry || '');
  const [companySize, setCompanySize] = useState(company.company_size || '');
  const [headquarters, setHeadquarters] = useState(company.headquarters || '');
  const [websiteUrl, setWebsiteUrl] = useState(company.website_url || '');
  const [foundedYear, setFoundedYear] = useState(company.founded_year ? String(company.founded_year) : '');
  const [photos, setPhotos] = useState<string[]>(company.photos || []);
  const [uploading, setUploading] = useState<'logo' | 'cover' | 'photo' | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  }

  async function uploadImage(file: File, kind: 'logo' | 'cover' | 'photo'): Promise<string | null> {
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return null; }
    if (file.size > 4 * 1024 * 1024) { setError('Image must be under 4MB.'); return null; }
    setUploading(kind); setError('');
    const path = `${company.id}/${kind}-${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage.from('company-logos').upload(path, file);
    setUploading(null);
    if (uploadError) { setError('Upload failed: ' + uploadError.message); return null; }
    const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'logo');
    if (url) setLogoUrl(url);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'cover');
    if (url) setCoverUrl(url);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 6) { setError('Up to 6 photos for now.'); return; }
    const url = await uploadImage(file, 'photo');
    if (url) setPhotos((p) => [...p, url]);
    e.target.value = '';
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true); setMessage(''); setError('');
    formData.set('logoUrl', logoUrl);
    formData.set('coverUrl', coverUrl);
    formData.set('companySize', companySize);
    formData.set('photos', JSON.stringify(photos));
    const result = await updateCompanyProfile(formData);
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    setMessage('Saved.');
  }

  async function generateWithAi() {
    setAiGenerating(true); setAiError('');
    try {
      const res = await fetch('/api/generate-company-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry, notes: aiNotes }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'Generation failed.'); setAiGenerating(false); return; }
      if (data.tagline) setTagline(data.tagline);
      if (data.description) setDescription(data.description);
      setAiOpen(false); setAiNotes('');
    } catch (e: any) {
      setAiError('Generation failed — please try again.');
    }
    setAiGenerating(false);
  }

  const busy = uploading !== null;

  return (
    <div className="container" style={{ maxWidth: 620 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>COMPANY PROFILE</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 6px' }}>Your company page</h1>
      <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 20 }}>
        Job seekers see this before they apply.{' '}
        <Link href={`/companies/${company.id}`} style={{ color: 'var(--gold)', fontWeight: 600 }}>View public page →</Link>
      </p>

      <form action={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <label>Cover photo</label>
          <div style={{
            height: 120, borderRadius: 10, marginBottom: 10, background: coverUrl ? `url(${coverUrl}) center/cover` : 'var(--paper-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)',
          }}>
            {!coverUrl && <span style={{ fontSize: 12, color: 'var(--slate)' }}>No cover photo</span>}
          </div>
          <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={busy} style={{ fontSize: 12 }} />
          {uploading === 'cover' && <div style={{ fontSize: 11.5, color: 'var(--slate)', marginTop: 4 }}>Uploading…</div>}

          <label style={{ marginTop: 16 }}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--line)' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 10, background: 'var(--paper-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--slate)', textAlign: 'center' }}>
                No logo
              </div>
            )}
            <div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={busy} style={{ fontSize: 12 }} />
              {uploading === 'logo' && <div style={{ fontSize: 11.5, color: 'var(--slate)', marginTop: 4 }}>Uploading…</div>}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <label>Company name</label>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} required />

          <div style={{ margin: '10px 0 16px' }}>
            {!aiOpen ? (
              <button type="button" className="btn-secondary" onClick={() => setAiOpen(true)} style={{ fontSize: 12.5 }}>
                ✨ Help me write this with AI
              </button>
            ) : (
              <div style={{ background: 'var(--paper-dim)', borderRadius: 10, padding: 12 }}>
                <label style={{ marginTop: 0, fontSize: 12 }}>Tell us about the company (optional) — what you do, what it's like to work there</label>
                <textarea
                  rows={3}
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="e.g. Family-owned electrical contractor, 20 years in Houston, mostly residential work, small crews, we train apprentices"
                  style={{ fontSize: 13 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" className="btn-gold" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={generateWithAi} disabled={aiGenerating}>
                    {aiGenerating ? 'Writing…' : 'Generate tagline + about'}
                  </button>
                  <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => { setAiOpen(false); setAiError(''); }}>Cancel</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 6 }}>
                  Fills in the tagline and description below — review and edit before saving. Based only on what's entered above and your open job postings, nothing invented.
                </div>
                {aiError && <div style={{ fontSize: 12, color: 'var(--rose)', marginTop: 6 }}>{aiError}</div>}
              </div>
            )}
          </div>

          <label>Tagline</label>
          <input name="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A one-line description, e.g. Family-owned since 1998" maxLength={140} />

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Industry</label>
              <input name="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Construction" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Company size</label>
              <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
                <option value="">Prefer not to say</option>
                {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Headquarters</label>
              <input name="headquarters" value={headquarters} onChange={(e) => setHeadquarters(e.target.value)} placeholder="e.g. Houston, TX" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Founded year</label>
              <input name="foundedYear" type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="e.g. 1998" />
            </div>
          </div>

          <label>Website</label>
          <input name="websiteUrl" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="e.g. yourcompany.com" />

          <label>About your company</label>
          <textarea
            rows={6}
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What you do, what it's like to work there, what makes this a good place to build a career."
          />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <label>Photos (up to 6) — your team, your workplace, on the job</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {photos.map((url, i) => (
              <div key={url} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)' }} />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, ii) => ii !== i))}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'var(--rose)', color: '#fff', fontSize: 11, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {photos.length < 6 && (
            <div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={busy} style={{ fontSize: 12 }} />
              {uploading === 'photo' && <div style={{ fontSize: 11.5, color: 'var(--slate)', marginTop: 4 }}>Uploading…</div>}
            </div>
          )}
        </div>

        <button className="btn-gold" type="submit" disabled={saving || busy}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {message && <div className="error-box" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>{message}</div>}
      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
