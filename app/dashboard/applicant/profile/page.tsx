'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveApplicantProfile } from './actions';

const SALARY_RANGES = [
  { value: '', label: 'Prefer not to say' },
  { value: '0', label: 'Under $30k' },
  { value: '30000', label: '$30k – $50k' },
  { value: '50000', label: '$50k – $75k' },
  { value: '75000', label: '$75k – $100k' },
  { value: '100000', label: '$100k – $150k' },
  { value: '150000', label: '$150k – $200k' },
  { value: '200000', label: '$200k+' },
];

const COMMON_SKILLS = [
  'Customer service', 'POS systems', 'Food safety', 'Inventory management', 'Teamwork',
  'AutoCAD', 'OSHA-10', 'Blueprint reading', 'Hand tools', 'Forklift operation',
  'Excel', 'Bookkeeping', 'Data entry', 'Scheduling', 'Project management',
  'JavaScript', 'Python', 'SQL', 'Git', 'Cloud platforms',
  'Patient care', 'EHR systems', 'BLS certification', 'Phlebotomy',
  'Legal research', 'Document preparation', 'Case management',
  'Curriculum planning', 'Classroom management', 'Bilingual',
  'Sales', 'Cold calling', 'CRM software', 'Leadership', 'Time management',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = ['Morning', 'Afternoon', 'Evening', 'Overnight', 'Flexible'];

export default function ApplicantProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>({});
  const [resumeText, setResumeText] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [availDays, setAvailDays] = useState<string[]>([]);
  const [availShift, setAvailShift] = useState('Flexible');
  const [salaryRange, setSalaryRange] = useState('');
  const [parsing, setParsing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('applicant_profiles').select('*').eq('user_id', user.id).single();
      if (data) {
        setProfile(data);
        setResumeText(data.resume_text || '');
        setSkillsList(data.skills || []);
        setSalaryRange(data.desired_salary != null ? String(data.desired_salary) : '');
        if (data.availability) {
          const parts = String(data.availability).split(' · ');
          if (parts[0]) setAvailDays(parts[0].split(', ').filter(Boolean));
          if (parts[1]) setAvailShift(parts[1].replace(' shifts', ''));
        }
      }
      setLoaded(true);
    })();
  }, []);

  function toggleSkill(skill: string) {
    setSkillsList((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  }
  function addCustomSkill() {
    const s = customSkill.trim();
    if (s && !skillsList.includes(s)) setSkillsList((prev) => [...prev, s]);
    setCustomSkill('');
  }
  function toggleDay(day: string) {
    setAvailDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

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
    if (data.error) { setMessage(data.detail ? `${data.error}: ${data.detail}` : data.error); setMessageIsError(true); return; }
    setProfile((p: any) => ({
      ...p, full_name: data.fullName || p.full_name, location: data.location || p.location,
      parsed_experience: data.experience, parsed_education: data.education, parsed_certifications: data.certifications,
    }));
    if (data.skills?.length) setSkillsList((prev) => Array.from(new Set([...prev, ...data.skills])));
    setMessage('Resume parsed — review the fields below, then save.'); setMessageIsError(false);
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
    if (data.error) { setMessage(data.detail ? `${data.error}: ${data.detail}` : data.error); setMessageIsError(true); return; }
    setReview(data);
  }

  function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage.from('resumes').upload(path, file);
    if (uploadError) { setMessage('Upload failed: ' + uploadError.message); setMessageIsError(true); return; }
    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path);
    setProfile((p: any) => ({ ...p, resume_url: urlData.publicUrl }));

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
      if (data.error) { setMessage(data.detail ? `${data.error}: ${data.detail}` : data.error); setMessageIsError(true); return; }
      setProfile((p: any) => ({
        ...p, full_name: data.fullName || p.full_name, location: data.location || p.location,
        parsed_experience: data.experience, parsed_education: data.education, parsed_certifications: data.certifications,
      }));
      if (data.skills?.length) setSkillsList((prev) => Array.from(new Set([...prev, ...data.skills])));
      setMessage('Resume uploaded and parsed — review the fields below, then save.'); setMessageIsError(false);
    }
  }

  async function handleSave(formData: FormData) {
    setSaving(true);
    formData.set('parsedExperience', JSON.stringify(profile.parsed_experience || []));
    formData.set('parsedEducation', JSON.stringify(profile.parsed_education || []));
    formData.set('parsedCertifications', JSON.stringify(profile.parsed_certifications || []));
    formData.set('skills', skillsList.join(', '));
    formData.set('desiredSalary', salaryRange);
    formData.set('availability', availDays.length ? `${availDays.join(', ')} · ${availShift} shifts` : `${availShift} shifts`);
    formData.set('resumeUrl', profile.resume_url || '');
    const result = await saveApplicantProfile(formData);
    setSaving(false);
    setMessage(result.error ? result.error : 'Profile saved.');
    setMessageIsError(!!result.error);
  }

  if (!loaded) return <div className="container">Loading…</div>;

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
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
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
        <div className="eyebrow" style={{ marginBottom: 8 }}>PROFILE</div>
        <label>Full name</label>
        <input name="fullName" defaultValue={profile.full_name} onChange={(e) => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} />
        <label>Location</label>
        <input name="location" defaultValue={profile.location} />
        <label>Bio</label>
        <textarea rows={3} name="bio" defaultValue={profile.bio} />

        <label>Skills</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {skillsList.map((s) => (
            <span key={s} onClick={() => toggleSkill(s)} className="tagpill"
              style={{ background: 'var(--ink)', color: '#fff', cursor: 'pointer' }}>
              {s} ✕
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
            placeholder="Type a skill and press Enter" />
          <button type="button" className="btn-secondary" onClick={addCustomSkill}>Add</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {COMMON_SKILLS.filter((s) => !skillsList.includes(s)).map((s) => (
            <span key={s} onClick={() => toggleSkill(s)} className="tagpill" style={{ cursor: 'pointer' }}>
              + {s}
            </span>
          ))}
        </div>

        <label>Desired salary</label>
        <select value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)}>
          {SALARY_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <p style={{ fontSize: 12, color: 'var(--slate)', margin: '4px 0 0' }}>Used only for salary-range comparisons you opt into — never shared without your knowledge.</p>

        <label>Availability</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {DAYS.map((d) => (
            <span key={d} onClick={() => toggleDay(d)} className="tagpill"
              style={{ cursor: 'pointer', background: availDays.includes(d) ? 'var(--ink)' : undefined, color: availDays.includes(d) ? '#fff' : undefined }}>
              {d}
            </span>
          ))}
        </div>
        <select value={availShift} onChange={(e) => setAvailShift(e.target.value)}>
          {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <label>Portfolio / website</label>
        <input name="portfolioUrl" defaultValue={profile.portfolio_url} />
        <label>LinkedIn</label>
        <input name="linkedinUrl" defaultValue={profile.linkedin_url} />

        {profile.parsed_experience?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>PARSED EXPERIENCE (from resume)</div>
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

      {message && (
        <div className="error-box" style={messageIsError ? {} : { background: 'var(--teal-soft)', color: 'var(--teal)' }}>
          {message}
        </div>
      )}
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
