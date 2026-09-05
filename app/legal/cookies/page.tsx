export const metadata = { title: 'Cookie Policy — Blarki' };

const h2 = { marginTop: 28, marginBottom: 10, fontSize: 19 } as const;

export default function CookiesPage() {
  return (
    <div>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>LEGAL</div>
      <h1 style={{ fontSize: 28, margin: '4px 0 6px' }}>Cookie Policy</h1>
      <p style={{ fontSize: 13, color: 'var(--slate)' }}>Last updated: [fill in effective date]</p>

      <p>
        Blarki currently uses exactly one kind of cookie, so this is a short page — and it should get longer
        (with a real cookie-consent banner) before adding any analytics or advertising tool.
      </p>

      <h2 style={h2}>Essential cookies (always on)</h2>
      <p>
        Our authentication provider (Supabase) sets a session cookie when you log in, so you stay signed in
        between page visits instead of re-entering your password on every request. This is strictly necessary
        for the site to function and cannot be turned off short of signing out or clearing your browser&apos;s
        cookies for this site.
      </p>

      <h2 style={h2}>What we don&apos;t currently use</h2>
      <p>
        As of this writing, Blarki has no third-party advertising cookies, and no analytics or tracking
        scripts (e.g. Google Analytics, Meta Pixel). If that changes — for example, adding a product-analytics
        tool to understand usage — this page and a cookie-consent banner should be added/updated first, before
        those cookies are set, per most cookie-law requirements (e.g. GDPR/ePrivacy in the EU, similar rules
        elsewhere).
      </p>

      <h2 style={h2}>Browser storage (not a cookie, but related)</h2>
      <p>
        The job-application form temporarily saves your in-progress answers in your browser&apos;s
        `sessionStorage` so you don&apos;t lose them if you navigate away mid-application. This stays on your
        device, is cleared once you submit or close the tab, and is never sent anywhere on its own.
      </p>

      <h2 style={h2}>Contact</h2>
      <p>Questions about cookies on Blarki: [fill in a real support/contact email].</p>
    </div>
  );
}
