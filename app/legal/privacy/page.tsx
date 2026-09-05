export const metadata = { title: 'Privacy Policy — Blarki' };

const h2 = { marginTop: 28, marginBottom: 10, fontSize: 19 } as const;

export default function PrivacyPage() {
  return (
    <div>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>LEGAL</div>
      <h1 style={{ fontSize: 28, margin: '4px 0 6px' }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: 'var(--slate)' }}>Last updated: [fill in effective date]</p>

      <p>
        This describes what Blarki actually collects and does with it today — written to match the real
        system, not generic boilerplate. As Blarki adds features (messaging, additional integrations), this
        page needs updating alongside them.
      </p>

      <h2 style={h2}>1. What we collect</h2>
      <p><strong>Account data:</strong> email address and password (handled by our authentication provider,
        Supabase — Blarki never sees or stores your raw password), and whether you signed up as an Applicant or
        a Company.</p>
      <p><strong>Applicant profile data:</strong> name, location, bio, skills, resume file and/or resume text,
        portfolio/LinkedIn links, desired salary, availability, and anything an uploaded resume contains
        (education, work history, certifications) — extracted by AI and shown to you for review before it's
        saved.</p>
      <p><strong>Company data:</strong> company name, job postings, screening questions, and billing information
        (handled by Stripe — see below).</p>
      <p><strong>Application data:</strong> which jobs you applied to, your screening-question answers, hiring
        status, interview scheduling, and — on paid plans — an AI-generated match score and summary.</p>
      <p><strong>Cookies:</strong> only the essential session cookie our authentication provider uses to keep
        you signed in. Blarki does not currently use third-party advertising or analytics trackers — see our{' '}
        <a href="/legal/cookies">Cookie Policy</a> for detail, and for what changes if that ever does.</p>

      <h2 style={h2}>2. How we use it</h2>
      <p>To operate your account, match Applicants with relevant jobs, let Companies review and rank
        applicants, process payments, send you notifications about your applications or job postings, and
        maintain platform security (rate-limiting abuse of AI features, for example).</p>

      <h2 style={h2}>3. Who sees your data</h2>
      <p>
        <strong>An Applicant&apos;s full resume, contact details, and screening answers are visible only to a
        Company once the applicant has actually applied to that Company&apos;s job</strong> — not before, and
        not to other Companies. Within a Company, anyone with access to that Company&apos;s account can see its
        applicants.
      </p>

      <h2 style={h2}>4. Third parties we share data with</h2>
      <p><strong>Anthropic (AI processing):</strong> resume content, job descriptions, and screening answers are
        sent to Anthropic&apos;s API to power resume parsing/review, job-description generation, and applicant
        scoring. This data is sent solely to generate the specific result you requested.</p>
      <p><strong>Stripe (payments):</strong> if a Company subscribes to a paid plan, billing and payment-card
        details are handled entirely by Stripe under Stripe&apos;s own privacy policy — Blarki only receives
        confirmation that a payment succeeded, not full card numbers.</p>
      <p><strong>Supabase (infrastructure):</strong> our database, authentication, and file-storage provider
        hosts all the data described above on our behalf.</p>
      <p>We do not sell personal data.</p>

      <h2 style={h2}>5. Data retention & your choices</h2>
      <p>
        We keep your data while your account is active. <strong>Self-service data export and account deletion
        are not yet built into the product</strong> — until they are, contact us at [fill in a real support
        email] to request a copy of your data or to have your account and associated data deleted, and we will
        handle it manually. [Once self-service export/deletion ships, update this section to describe it and
        remove this bracket.]
      </p>

      <h2 style={h2}>6. Security</h2>
      <p>
        Access to your data is restricted at the database level (row-level security) so that, for example, one
        Applicant cannot read another Applicant&apos;s profile, and one Company cannot see another Company&apos;s
        applicants. No system is perfectly secure; if you believe your account has been compromised, contact us
        immediately.
      </p>

      <h2 style={h2}>7. Children</h2>
      <p>Blarki is not directed at, and is not knowingly used by, children under the age required by law in
        their jurisdiction to hold an employment-platform account.</p>

      <h2 style={h2}>8. Changes to this policy</h2>
      <p>We&apos;ll update the &quot;Last updated&quot; date above when this policy materially changes.</p>

      <h2 style={h2}>9. Contact</h2>
      <p>Questions about this policy, or a data request: [fill in a real support/contact email].</p>
    </div>
  );
}
