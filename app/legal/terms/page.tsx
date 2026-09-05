export const metadata = { title: 'Terms of Service — Blarki' };

const h2 = { marginTop: 28, marginBottom: 10, fontSize: 19 } as const;

export default function TermsPage() {
  return (
    <div>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>LEGAL</div>
      <h1 style={{ fontSize: 28, margin: '4px 0 6px' }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: 'var(--slate)' }}>Last updated: [fill in effective date]</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of Blarki (&quot;Blarki,&quot;
        &quot;we,&quot; &quot;us&quot;), a hiring platform that connects job seekers (&quot;Applicants&quot;) with
        employers (&quot;Companies&quot;) and uses AI to help generate job postings, screen applicants, and rank
        candidates. By creating an account or using Blarki, you agree to these Terms.
      </p>

      <h2 style={h2}>1. Accounts</h2>
      <p>
        You need an account to post jobs, apply to jobs, or access most of Blarki. You must provide accurate
        information, keep your login credentials secure, and are responsible for activity under your account.
        You must be legally able to enter a binding contract to use Blarki — this platform is not directed at
        children and is not intended for use by anyone under the age required by law in their jurisdiction.
      </p>

      <h2 style={h2}>2. What Companies may post</h2>
      <p>
        Job postings must be real, current openings — no fake, expired, or duplicate listings, and no requests
        to pay for a job, move communication off-platform to avoid review, or other patterns commonly associated
        with employment scams. Blarki reserves the right to remove any posting, or suspend any account, that it
        reasonably believes violates this or misleads Applicants. A posting requires an application-closing date
        and stops accepting applications automatically once that date passes or the position is marked filled.
      </p>

      <h2 style={h2}>3. What Applicants submit</h2>
      <p>
        You are responsible for the accuracy of your resume, profile, and application answers. Do not
        impersonate someone else, submit someone else&apos;s resume as your own, or apply using automated tools
        designed to submit bulk or spam applications.
      </p>

      <h2 style={h2}>4. AI features</h2>
      <p>
        Blarki uses a third-party AI provider (Anthropic) to generate job descriptions and screening questions,
        parse and review resumes, and score/rank applicants against a specific job&apos;s stated requirements.
        These features are evaluated only on job-related information you or the Company provide — skills,
        experience, education, certifications, and screening-answer quality — never inferred personal
        characteristics. AI output can be wrong or incomplete; Companies remain responsible for their own hiring
        decisions, and Blarki does not guarantee any particular match score, ranking, or hiring outcome.
      </p>

      <h2 style={h2}>5. Payment & subscriptions</h2>
      <p>
        Paid plans are billed on a recurring basis through Stripe, our payment processor — Blarki does not
        store your card details. You can view, change, or cancel your plan at any time from Dashboard →
        Billing → &quot;Manage billing / cancel,&quot; which opens Stripe&apos;s secure billing portal. Cancelling
        stops future billing; it does not retroactively refund the current billing period unless required by
        law or stated otherwise at the time of purchase. [Fill in your actual refund policy here.]
      </p>

      <h2 style={h2}>6. Acceptable use</h2>
      <p>
        Don&apos;t misuse Blarki — see our <a href="/legal/acceptable-use">Acceptable Use Policy</a> for specifics
        on scraping, scam postings, spam applications, and similar prohibited conduct.
      </p>

      <h2 style={h2}>7. Termination</h2>
      <p>
        You may stop using Blarki and close your account at any time by contacting us. We may suspend or
        terminate accounts that violate these Terms, engage in fraud, or pose a risk to other users of the
        platform.
      </p>

      <h2 style={h2}>8. Disclaimers & limitation of liability</h2>
      <p>
        Blarki is provided &quot;as is.&quot; We do not guarantee uninterrupted availability, that any job
        posting is accurate, or that any candidate match is suitable for hire. To the maximum extent permitted
        by law, Blarki is not liable for indirect, incidental, or consequential damages arising from use of the
        platform. [This section in particular needs jurisdiction-specific legal review before launch.]
      </p>

      <h2 style={h2}>9. Changes to these Terms</h2>
      <p>
        We may update these Terms as the product changes. Material changes will be reflected by updating the
        &quot;Last updated&quot; date above.
      </p>

      <h2 style={h2}>10. Contact</h2>
      <p>Questions about these Terms: [fill in a real support/contact email].</p>
    </div>
  );
}
