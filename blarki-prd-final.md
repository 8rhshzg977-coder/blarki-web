# Blarki — Product Requirements Document (Final, v1.0)

Supersedes all earlier draft documents from when the project was internally
named "Vetted" (`vetted-prd-consolidated.md`, `vetted-prd-addendum-v4.md`,
`vetted-prd-addendum-v5.md`, and `vetted-platform-plan.md`) — this is the
single source of truth going forward. Specs only; no implementation until this
and the companion roadmap are approved.

---

## Part I — Vision & operating principles

**Blarki** is an AI-powered hiring intelligence platform that helps companies
identify the best candidates faster through AI matching, skill evaluation,
resume analysis, screening, and transparent hiring decisions.

Position as an **AI Hiring Intelligence Platform**, not another job board.
Indeed's pitch is "post jobs and receive applications." This platform's pitch
is "identify the strongest candidates faster, with explainable AI." The wedge:
real-time listing accuracy (no zombie postings weeks after they're filled) and
answering "who should I interview first?"

**Non-negotiable**: optimized to maximize successful matches, not employer ad
revenue. Ranking priority: match relevance, location, user preferences, and
employer responsiveness — before sponsored placement is ever considered.
Sponsored jobs get a bounded visibility boost; they never hide a better organic
result.

**Scope filter, applied throughout**: every feature must reduce hiring time,
increase hiring quality, or improve transparency. Anything that adds
complexity without clear near-term value gets simplified or deferred — see the
roadmap for where that filter was actually applied.

Marketing copy leads with outcomes ("find your best candidates in minutes, not
hours"), not technology ("we use AI").

### Dependency tagging convention

From here on, any feature that depends on something outside this team's direct
control gets one or more of these tags, so it stays visible in the product
vision without being mistaken for something ready to build:

- **[Vendor dependency]** — needs a paid external data or service provider
- **[Third-party integration]** — needs an external API/OAuth integration
  (e.g. calendar, video conferencing, SSO)
- **[Requires legal/compliance review]** — needs actual legal sign-off before
  production use, not just product design
- **[Future implementation dependency]** — blocked on another internal
  feature landing first, not on anything external

A tagged feature stays in the PRD and roadmap — tagging isn't a way of
dropping it, it's a way of being honest about what has to be true before it
can actually ship.

---

## Part II — Accounts, identity & trust

### Account types
Job seeker, employer, and **platform admin** — three account types, each with
its own dashboard, permissions, and feature set.

### Authentication
Real email required, secure login, stay logged in between sessions, log out,
password reset, required email verification, change password, optional 2FA,
industry-standard password hashing (bcrypt/argon2) — no plaintext, ever.

### Job seeker profile
Editable anytime: photo (optional), name, location, email, phone, bio, resume,
education, experience, skills, certifications, licenses, portfolio/website,
LinkedIn (optional), languages, desired salary, preferred job types, preferred
locations, availability. Seeker controls profile visibility — full resume,
contact info, and screening answers are only visible to a company once the
seeker has applied to that company's job.

### Verification badges
- **Verified Company** — verified business email domain + business
  registration info on file.
- **Verified Recruiter** — tied to in-platform messaging; marks confirmed
  hiring-team members so applicants know who's actually reading their message.
- **Verified Applicant** — verified email + verified phone only. No
  identity-document verification for general job seekers. Optional
  certification/license verification is a stated future extension.
- Explicitly rejected: biometric selfie verification for recruiters or
  applicants — real privacy cost, marginal fraud benefit, and it would
  discourage legitimate small employers and job seekers alike. Verified
  domain + MFA + business info + manual review covers this with far less
  friction.

### Employer verification
Verified business email domain, optional MFA, business registration info
(EIN/VAT-type) collected and flagged for manual review on mismatch rather than
hard-blocked, optional linkage to an external verified business profile
(LinkedIn/Google Business) as corroborating signal.

### Admin portal
A dedicated portal for platform administrators: review flagged companies and
job postings, review scam/community reports, suspend or ban accounts (both
fraudulent employers and spam applicants), review disputes, manage
subscriptions, view platform-wide analytics, respond to support tickets,
review AI errors, approve company verification requests. This exists because
the trust & safety features below produce a review queue that needs somewhere
to actually be processed — it isn't a separate nice-to-have, it's what makes
those features functional.

### Trust & safety
**Job posting quality checks**, pre-publish: missing/unrealistic salary (salary
is a mandatory structured field — see Part IV), known scam phrases ("WhatsApp
interview," "buy your own equipment," "crypto payout"), duplicate/copied
description text, suspicious external links, requests to move communication
off-platform early. Flagged postings go to the admin review queue, not an
instant auto-reject.

**Duplicate/stale listing detection**: an employer reposting an unchanged
listing repeatedly gets prompted to renew the existing one instead of creating
a duplicate. **Anti-scraping**: detect and demote/ban accounts aggregating and
reposting third-party listings without permission.

**Applicant-side spam detection**: mass applications submitted in seconds,
AI-generated boilerplate resumes, duplicate accounts, fake identities — rate-
limited and flagged for review; repeated confirmed violations lead to account
limits or suspension. **Basic duplicate-application prevention** (same person,
same job, twice) is enforced structurally, not just detected.

**Community reporting**: incentivize accurate fraud reports (e.g. by
prioritizing that reporter's own applications going forward).

### Audit history
Every meaningful change (job description edits, hiring-stage moves, interview
date changes, company profile edits) is logged with actor and timestamp.
Displayed to companies as a readable timeline — "John Smith moved Applicant A
to Interview on July 30" — most valuable once multiple recruiters share an
account.

---

## Part III — Job seeker experience

### Resume upload, AI review & job-specific tailoring
Upload a resume; AI extracts structured fields (name, education, experience,
skills, certifications) and pre-fills the profile for the seeker to review and
edit — nothing saves automatically without their review. AI also gives general
resume feedback (strengths, missing skills, quality notes, suggested
improvements) and, per job, a **"improve my resume for this job"** action that
compares the resume against that specific posting and suggests targeted
changes, missing keywords, and stronger wording.

### Profile completion score
A LinkedIn-style strength meter against the seeker's own profile fields (e.g.
"82% — resume uploaded ✔, skills added ✔, portfolio missing ✘"). Pure
front-end logic against data that already exists on the profile.

### Job search & discovery
- Homepage search bar for open-text search, fast and accurate.
- **AI natural-language search**: "entry-level civil engineering jobs near
  Houston paying at least $75,000" gets interpreted into structured filters,
  as an alternative to manually setting each filter.
- Full category taxonomy (Construction & Skilled Trades, Engineering,
  Technology & IT, Healthcare, Finance & Accounting, Education, Retail,
  Restaurants & Hospitality, Manufacturing, Transportation & Logistics,
  Warehouse, Government, Sales, Marketing, Customer Service, Human Resources,
  Business & Management, Legal, Science & Research, Real Estate, Agriculture,
  Arts & Media, Security, Internships, Freelance & Gig Work) — jobs tagged
  with multiple attributes (category, industry, employment type, experience
  level, work location, specific skills), not filed under one category only.
- Nearby jobs via Google Maps (map + list view, distance filter: 5/10/25/50/
  100 miles); later, actual commute time (drive/transit), not just radius.
- Advanced filters: remote/hybrid/on-site, salary range (slider, hourly or
  yearly), employment type, experience level, education/certifications
  required, company size, industry, distance, date posted, closing date,
  **exclude keywords**. Filters save as default preferences.
- **Saved searches + job alerts**: save a set of criteria, get notified when a
  new posting matches — without re-searching manually.
- Saved jobs, with a notification if a saved job closes or is filled.
- Recently viewed jobs and companies.
- Compare two or more jobs side-by-side: salary, distance, benefits, required
  experience, match score.
- Company search by name, industry, or location, nearest office shown first.

### AI job matching
Every job shows a Match Score, always paired with an explanation — never a
bare percentage:
```
Match Score: 94%
Reasoning: resume aligns with responsibilities; exceeds required experience;
holds all required certifications; missing one preferred skill (Primavera P6)
Strengths: Leadership, Communication, AutoCAD, OSHA Certification
Areas to improve: Primavera P6, Bridge inspection experience
```
Inputs are strictly job-related — resume, skills, experience, education,
certifications, assessment results, screening answers, stated preferences.
Never personality, tone, or protected characteristics (Part VI has the full
AI-principles list this and every other AI feature follows).

**AI skill gap analysis** extends "areas to improve" into something specific
and actionable ("you're missing: OSHA 30, Primavera P6, 2 years of field
experience") and recommends learning resources or certifications to close
each gap.

**AI salary insights**: where legally and contractually appropriate, show
public-market data — typical salary range, local market average, required
experience, demand — sourced from a real labor-market data provider, not
AI-generated from general knowledge (see the schema gap-analysis document for
why this is a vendor dependency, not a build-it-yourself feature).

### Applying
Choose/upload a resume → answer AI-generated screening questions tailored to
that specific role → answer any custom employer questions → optional ~300-
character free-response pitch → submit → confirmation.

### After a decision
Required, specific, constructive feedback — not optional:
- Accepted (1–2 sentences): "You demonstrated strong AutoCAD and project-
  coordination experience, which closely matched what we needed."
- Rejected (2–3 sentences, always actionable): "Your application was
  competitive, but another candidate more closely matched our required
  Primavera P6 experience. Strengthening that could help in future
  applications."

### Status tracking
Always know exactly what stage an application is on. Canonical stage list
(displayed to the seeker with a timestamp per stage reached; the visual
convention is a checklist — ✓ completed stages, ○ upcoming ones):
`Application Submitted → AI Resume Review → Recruiter Review → Hiring Manager
Review → Interview Requested → Interview Scheduled → Interview Completed →
Final Decision → Offer Sent → Hired / Rejected`
Every change fires an in-app notification (always) and email notification
(on by default, toggleable); push is reserved for a future mobile app.

### Applicant dashboard
Today's recommendations, application progress, upcoming interviews, resume
score, saved jobs, recently viewed, AI recommendations, companies viewed,
messages, notifications.

### Settings
Notification preferences, privacy/visibility settings, job alert preferences,
theme (light/dark), language, account deletion, data download (own resume,
profile, and application history).

---

## Part IV — Employer experience

### Company page
Every company gets a page inside the platform — effectively a mini company
website. **Simple version is MVP** (logo, description, photos, open jobs —
the trust argument: job seekers trust companies they can actually see).
**Full version is V2**: banner, mission, values, videos, multiple office
locations (nearest shown first), benefits detail, hiring team display
(company's choice whether to show it), social media links, company
updates/news feed.

### Team management & permissions
Invite teammates by email. Roles: Owner, Administrator, HR Director/Manager,
Recruiter, Hiring Manager, Department Manager, Interviewer — permissions
customizable per role, per company (not fixed presets), enforced server-side
via database row-level security. **Owner + HR Manager is MVP**; the full
six-role customizable matrix is V2, once a hiring team is actually big enough
to need that granularity.

### Employer dashboard
Open jobs, applications received today, interviews scheduled, average
time-to-hire, top-ranked candidates, jobs nearing their closing date,
positions requiring action, today's tasks, hiring pipeline summary. As AI
recommendations and messaging come online, those surface here too.

### Creating a job posting
Employer enters title, location, **mandatory structured salary field**,
benefits, experience/education/certifications required, required and
preferred skills, employment type, remote/on-site, and a **mandatory
application-closing date** — a job cannot publish without one.

**Employer preference interview**: instead of just a job title, AI asks about
the ideal candidate — years of experience, certifications, leadership
expectations, customer-facing vs. back-office, team-heavy vs. independent
work, outdoor work comfort, travel willingness, bilingual preference, shift
flexibility, specific software experience. AI generates the description,
screening questions, and ranking weights from those answers. **Condition**:
these preference answers become visible, stated requirements on the posting
itself, not hidden scoring inputs — keeps matching explainable and avoids
several of these dimensions (travel, shift flexibility, bilingual preference)
functioning as undisclosed proxies for protected characteristics.

AI auto-generates the full professional description (title, responsibilities,
qualifications, preferred qualifications, benefits section, formatting);
employer can edit every part, before and after publishing, at any time.

**Conversational AI assistant for employers**, beyond initial generation:
"Write a better job description." / "Why aren't I getting qualified
applicants?" / "How can I improve this posting?" / "Which requirements are
filtering out too many people?" / "Summarize the top 20 applicants."

### Reusable templates
Duplicate an old posting into a new draft (MVP). Save a full job posting as a
named template, save a screening-question set, save a hiring-pipeline
configuration (V2 — needs dedicated template management, not just a one-time
copy).

### AI screening questions
Generated from the specific role's requirements — a Civil Engineer, a
Software Engineer, a Restaurant Manager, a Nurse, and an Electrician each get
meaningfully different questions. Employer can edit, delete, add, and
reorder.

### Application closing & live verification
A job cannot publish without a closing date. It closes automatically the
instant the date arrives or the employer marks the position filled —
whichever happens first. This is real-time, not a batch job: the moment it
closes, it's instantly gone from public search, recommendations, and new
applications. Stays visible to the employer, marked Closed, extendable or
reopenable. Anyone who saved it gets a "filled or closed" notification.

### Applicant ranking & review
AI ranks using only job-related signal: skills, experience, education,
certifications, assessment/skill-test results, resume relevance, screening-
answer quality. **When an employer opens an applicant, AI leads with a plain-
language summary** before the full detail — "This candidate has 6 years of
project management experience, holds OSHA 30 and AutoCAD certifications,
exceeds the required experience, but does not have bridge inspection
experience" — then the employer reads further if they want to. Full detail
view: resume, AI summary, screening answers, resume analysis, certifications,
skills, experience, education, match score with full reasoning, employer
notes, current status.

### Pipeline & applicant management
Drag-and-drop Kanban across the full stage list above. **Internal notes**
(recruiter-only, never applicant-visible — "great communicator," "schedule
second interview"). **Applicant tags** (Favorite, Top Candidate, Needs
Follow-up, Future Opening, Internship Candidate). **Bulk actions** (select
many, move stage, reject, mark review-later, send batch email — V2, most
valuable at real applicant volume). **Duplicate-applicant detection** (basic
same-email-same-job block is structural/MVP; fuzzy same-person-different-
account detection is V2).

### Interview scheduling
Employer proposes date/time slots → applicant confirms or requests a
different time → both sides' status updates automatically → reminders at 24
hours, 1 hour, and 15 minutes before. Video conferencing integration and
external calendar sync (Google/Outlook) are stated future capabilities
(separate third-party integrations, V2).

### Direct communication
Applicant's optional pitch is visible to the employer. Verified recruiters can
message applicants in-platform; conversations stay in-platform unless both
sides choose to exchange outside contact info (V2 — full messaging system).
"Warm introduction tokens" (limited credits to message a recruiter before
applying) is a stated future idea, needing its own abuse-prevention design
before it ships.

### Analytics & hiring quality
Beyond basic applications/interviews counts: average match score, applications
per day, average hiring time, average response time, interview-to-offer
conversion rate, offer-acceptance rate, applicant-quality trend, which jobs
convert best, time until first qualified applicant. The **Hiring Quality
Dashboard** (post-hire) shows time-to-hire trends, which screening questions
best predicted a successful hire, and which postings attracted the strongest
applicant pool — the platform's stated long-term differentiator, since it
needs real hire-history data to be meaningful.

**Hiring insights feedback loop**: after a hire, ask the employer to rate the
AI's recommendation (Excellent/Good/Average/Poor) — feeds back into improving
future matching and measures whether employers actually find the AI useful.

---

## Part V — AI principles (govern every AI feature above)

- Every AI output — job descriptions, screening questions, resume analysis,
  match scores, rankings, recommendations, post-decision feedback — ships
  with a plain-language explanation. Never a bare score.
- Evaluates people using only job-related qualifications: skills, experience,
  education, certifications, assessment results, screening-answer quality.
- Never claims to detect honesty, personality, or emotional state from video,
  voice, or facial expression — not built, in any form.
- Never uses or infers protected characteristics anywhere in scoring or
  ranking.
- **Salary-related insights use only what the applicant voluntarily states.**
  No inferring salary expectations, seniority, age, or offer-acceptance
  likelihood from experience or qualifications. If no desired salary is
  provided, the AI says plainly that no comparison is available — it never
  guesses.
- Feedback to applicants, accepted or rejected, is always constructive and
  specific enough to act on.

---

## Part VI — Design, accessibility & technical requirements

**Design**: modern, professional, responsive (desktop/tablet/mobile), clean
typography, minimal clutter, intuitive navigation, fast load times. Dashboards
read like Linear/Stripe/Vercel, not a cluttered admin panel. Light and dark
mode both supported (dark mode ships in V2 — see roadmap).

**Accessibility**: keyboard navigation, screen reader support, sufficient
color contrast, descriptive labels — foundational from day one, applied
platform-wide, not a feature with its own phase.

**Technical & security**: scalable architecture, RBAC enforced server-side
(database row-level security, not just UI checks), encryption at rest for
sensitive data, audit logging, automated backups, protection against SQL
injection/XSS/CSRF, rate limiting on auth and write endpoints, documented
modular codebase, database schema that supports future features (salary
benchmarking, interview transcription, HR-system integrations) without
restructuring existing tables.

---

## Part VII — Legal, trust & support

**Legal pages**: Terms of Service, Privacy Policy, Cookie Policy, Acceptable
Use Policy — required before any public launch, not a phased feature. Draft
starting points can come from this process; actual legal review before
production reliance is necessary given the platform handles resumes, contact
information, and payment data.

**Data export**: users download their own resume, profile, and application
history (self-service, MVP). Employers can export applicant data where
appropriate and compliant with applicable privacy law — this side needs
extra design care since it moves another person's data to a third party (V2).

**Help center**: FAQ, contact support, report a problem, feature requests.

---

## Part VIII — Pricing & monetization

**Subscription tiers**: Free (1 active job, basic AI description, 20
applicants, basic dashboard) → Starter $39/mo (5 active jobs, AI descriptions
and screening questions, AI ranking, resume analysis, email support) →
Professional $149/mo (unlimited jobs/applicants, team collaboration,
analytics, saved templates, advanced matching) → Business $399/mo (everything
in Professional, multiple locations, advanced reporting, API access, priority
support, SSO) → Enterprise (custom).

**Add-ons**: AI Interview Coach, premium resume review, Featured Employer
placement (bounded per Part I — never buries organic results), Verified
Skills assessment badges, advanced Hiring Reports.

**Pay-per-successful-hire**: post free, use AI ranking, pay a flat one-time
fee only on a successful hire. **No custom escrow or fund-custody system, in
any version.** If escrow is ever genuinely needed later, it routes through a
licensed third-party provider (e.g. Stripe Connect) only. **Hire verification
is trust-based**: the employer self-reports a hire by moving someone to
"Hired" in the pipeline, and billing runs on that report — no automatic
hire-detection in this version. Stronger verification (potentially via future
HR-system integrations) is an explicit later exploration, not a requirement
now.
