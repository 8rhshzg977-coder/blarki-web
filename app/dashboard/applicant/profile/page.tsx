'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveApplicantProfile } from './actions';

export default function ApplicantProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>({});
  const [resumeText, setResumeText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('applicant_profiles').select('*').eq('user_id', user.id).single();
      if (data) { setProfile(data); setResumeText(data.resume_text || ''); }
    })();
  }, []);

  async function parseResume() {
    if (!resumeText.trim()) return;
    setParsing(true);
    const res = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText }),
    });
    const data = await res.json();
    setParsing(false);
    if (data.error) { setMessage(data.error); return; }
    setProfile((p: any) => ({
      ...p,
      full_name: data.fullName || p.full_name,
      location: data.location || p.location,
      skills: data.skills || p.skills,
      parsed_experience: data.experience,
      parsed_education: data.education,
      parsed_certifications: data.certifications,
    }));
    setMessage('Resume parsed — review the fields below, then save.');
  }

  async function reviewResume() {
    if (!resumeText.trim()) return;
    setReviewing(true);
    const res = await fetch('/api/review-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText }),
    });
    const data = await res.json();
    setReviewing(false);
    if (data.error) { setMessage(data.error); return; }
    setReview(data);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload the raw file to Supabase Storage (bucket 'resumes' must exist)
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('resumes').upload(path, file);
    if (uploadError) { setMessage('Upload failed: ' + uploadError.message + ' (has the "resumes" storage bucket been created?)'); return; }
    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path);
    setProfile((p: any) => ({ ...p, resume_url: urlData.publicUrl }));

    // If it's a PDF, also send straight to AI parsing (no separate text extraction needed)
    if (file.type === 'application/pdf') {
      setParsing(true);
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeBase64: base64, mediaType: 'application/pdf' }),
      });
      const data = await res.json();
      setParsing(false);
      if (!data.error) {
        setProfile((p: any) => ({
          ...p, full_name: data.fullName || p.full_name, location: data.location || p.location,
          skills: data.skills || p.skills, parsed_experience: data.experience,
          parsed_education: data.education, parsed_certifications: data.certifications,
        }));
        setMessage('Resume uploaded and parsed — review the fields below, then save.');
      }
    }
  }

  async function handleSave(formData: FormData) {
    setSaving(true);
    formData.set('parsedExperience', JSON.stringify(profile.parsed_experience || []));
    formData.set('parsedEducation', JSON.stringify(profile.parsed_education || []));
    formData.set('parsedCertifications', JSON.stringify(profile.parsed_certifications || []));
    const result = await saveApplicantProfile(formData);
    setSaving(false);
    setMessage(result.error ? result.error : 'Profile saved.');
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="eyebrow">MY PROFILE</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>Profile &amp; resume</h1>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 8 }}>RESUME</div>
        <label>Upload a PDF</label>
        <input type="file" accept="application/pdf" onChange={handleFileUpload} />
        <p style={{ fontSize: 12, color: 'var(--slate)', margin: '6px 0 14px' }}>— or paste resume text below —</p>
        <textarea rows={8} value={resumeText} onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here" />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button type="button" className="btn-secondary" onClick={parseResume} disabled={parsing}>
            {parsing ? 'Parsing…' : '🔍 AI-fill my profile from this'}
          </button>
          <button type="button" className="btn-secondary" onClick={reviewResume} disabled={reviewing}>
            {reviewing ? 'Reviewing…' : '📝 AI resume review'}
          </button>
        </div>

        {review && (
          <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--paper-dim)', borderRadius: 8 }}>
            <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--teal)' }}>STRENGTHS</div>
            <ul style={{ fontSize: 13, margin: '0 0 10px', paddingLeft: 18 }}>
              {(review.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
            <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--gold)' }}>SUGGESTED IMPROVEMENTS</div>
            <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
              {(review.suggestedImprovements || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>

      <form action={handleSave} className="card">
        <input type="hidden" name="resumeText" value={resumeText} />
        <input type="hidden" name="resumeUrl" value={profile.resume_url || ''} />
        <div className="eyebrow" style={{ marginBottom: 8 }}>PROFILE</div>
        <label>Full name</label>
        <input name="fullName" defaultValue={profile.full_name} onChange={(e) => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} />
        <label>Location</label>
        <input name="location" defaultValue={profile.location} />
        <label>Bio</label>
        <textarea rows={3} name="bio" defaultValue={profile.bio} />
        <label>Skills (comma separated)</label>
        <input name="skills" defaultValue={(profile.skills || []).join(', ')} />
        <label>Portfolio / website</label>
        <input name="portfolioUrl" defaultValue={profile.portfolio_url} />
        <label>LinkedIn</label>
        <input name="linkedinUrl" defaultValue={profile.linkedin_url} />
        <label>Desired salary</label>
        <input name="desiredSalary" type="number" defaultValue={profile.desired_salary} placeholder="Optional — used only for salary-range comparisons you opt into" />
        <label>Availability</label>
        <input name="availability" defaultValue={profile.availability} placeholder="e.g. Weekdays, full-time" />

        {profile.parsed_experience?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>PARSED EXPERIENCE (from resume — edit above if inaccurate)</div>
            {profile.parsed_experience.map((e: any, i: number) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>
                {e.title} @ {e.employer} ({e.dates})
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 18 }}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      {message && <div className="error-box" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>{message}</div>}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
