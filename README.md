# Blarki — real web app

This is a working Next.js app wired to your live Supabase database. It covers the
MVP slice: real signup/login (company or applicant), AI-generated job postings,
real job search, and real applications with screening questions.

Not in this slice yet (next to build): applicant ranking dashboard, pipeline,
messaging, resume upload/parsing, saved jobs, Stripe billing. The prototype you've
been clicking through shows what all of those look like — we'll port them into
this real app the same way we just did these.

## Deploy it — step by step

### 1. Push this code to GitHub
1. Go to github.com, click the **+** in the top right → **New repository**
2. Name it `blarki-web`, leave it Public or Private (your choice), don't add a
   README (we already have one) → **Create repository**
3. On the next page, click **uploading an existing file**
4. Drag every file and folder from this project into that upload box (your browser
   needs to support folder drag — Chrome does)
5. Scroll down, click **Commit changes**

### 2. Import it into Vercel
1. Go to vercel.com → sign up/log in **with your GitHub account** (this lets Vercel
   see your repos)
2. Click **Add New… → Project**
3. Find `blarki-web` in the list and click **Import**
4. Before clicking Deploy, click **Environment Variables** and add these four
   (values from your notes doc — the Supabase keys and Project URL you saved
   earlier, plus your Anthropic key from console.anthropic.com):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon/publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role/secret key |
   | `ANTHROPIC_API_KEY` | your Anthropic API key |

5. Click **Deploy**. Takes about a minute.

### 3. Point Supabase at your real URL
1. Once deployed, Vercel gives you a URL like `https://blarki-web-yourname.vercel.app`
2. Go back to Supabase → **Authentication → URL Configuration**
3. Change **Site URL** from `http://localhost:3000` to your real Vercel URL
4. Save

### 4. Test it
Visit your Vercel URL, click "I'm hiring," create an account with a real email,
post a job, then open the site in a private/incognito window and apply to it as
an applicant. If email confirmation is on (Supabase default), check your inbox
to confirm before logging in.

## Getting an Anthropic API key (needed for AI job descriptions)
1. Go to console.anthropic.com → sign up/log in
2. **API Keys** → **Create Key**
3. Add billing (API usage is pay-as-you-go, separate from a Claude.ai subscription)
4. Copy the key into Vercel's environment variables as shown above

## Local development (optional, if you want to run this on your own computer)
```bash
npm install
cp .env.local.example .env.local   # then fill in the real values
npm run dev
```
Open http://localhost:3000
