export const metadata = { title: 'Acceptable Use Policy — Blarki' };

const h2 = { marginTop: 28, marginBottom: 10, fontSize: 19 } as const;

export default function AcceptableUsePage() {
  return (
    <div>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>LEGAL</div>
      <h1 style={{ fontSize: 28, margin: '4px 0 6px' }}>Acceptable Use Policy</h1>
      <p style={{ fontSize: 13, color: 'var(--slate)' }}>Last updated: [fill in effective date]</p>

      <p>This policy exists to keep Blarki trustworthy for both sides of a hiring decision. Violating it can
        result in content removal, account suspension, or a permanent ban, at Blarki&apos;s discretion.</p>

      <h2 style={h2}>If you're posting jobs (Companies)</h2>
      <ul>
        <li>No fake, expired, already-filled, or duplicate listings.</li>
        <li>No requests for an applicant to pay for anything (equipment, training, a "processing fee") as a
          condition of applying or being hired.</li>
        <li>No pressuring applicants to move communication off-platform before a real hiring conversation has
          started, or other patterns commonly associated with employment scams (e.g. interview entirely over
          chat apps, vague job descriptions with unusually high pay).</li>
        <li>No scraping or reposting job listings from other sites or platforms without permission.</li>
        <li>No requirements or screening questions designed to infer a candidate&apos;s protected
          characteristics (race, gender, age, disability, religion, national origin, etc.) rather than
          job-related qualifications.</li>
      </ul>

      <h2 style={h2}>If you're applying to jobs (Applicants)</h2>
      <ul>
        <li>No fake identities, no applying on someone else&apos;s behalf without their knowledge, no
          fabricated resumes or credentials.</li>
        <li>No automated or bulk-submitted applications, and no attempting to apply to the same job multiple
          times to bypass the one-application-per-job limit.</li>
        <li>No abusive, harassing, or discriminatory language directed at a Company or its hiring team.</li>
      </ul>

      <h2 style={h2}>For everyone</h2>
      <ul>
        <li>No attempting to access another user&apos;s account or data, or to bypass Blarki&apos;s access
          controls.</li>
        <li>No attempting to abuse or overload Blarki&apos;s AI features (automated scripts hammering the
          resume-review or job-generation endpoints, for example) — these are rate-limited, and repeated
          attempts to circumvent that may result in suspension.</li>
        <li>No uploading malware, or content that is illegal, defamatory, or infringes someone else&apos;s
          intellectual property.</li>
      </ul>

      <h2 style={h2}>Reporting a problem</h2>
      <p>
        If you encounter a suspicious listing, a scam attempt, or abusive behavior, report it to [fill in a
        real support/contact email or an in-app report flow, once built]. See our{' '}
        <a href="/legal/terms">Terms of Service</a> and <a href="/legal/privacy">Privacy Policy</a> for the
        rest of the picture.
      </p>
    </div>
  );
}
