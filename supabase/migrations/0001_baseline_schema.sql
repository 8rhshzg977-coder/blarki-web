-- Blarki — baseline schema (reconstructed)
--
-- This file did NOT come from `supabase db dump` — there was no
-- version-controlled schema before this, so the tables, columns, and
-- relationships below were reverse-engineered by reading every
-- `.from('table')` / `.insert()` / `.select()` call in the app code.
-- Treat it as "best effort, verify against the real thing" rather than an
-- exact export.
--
-- IT IS SAFE TO RUN THIS AGAINST YOUR EXISTING LIVE SUPABASE PROJECT:
--   - every `create table` is `if not exists` — a table that already exists
--     is left completely untouched, structure and data both.
--   - every `alter table ... add column` is `if not exists` — an existing
--     column is never modified, only a genuinely missing one is added.
--   - `enable row level security` is a harmless no-op if it's already on.
--   - nothing in this file ever DROPs or REPLACEs anything.
--
-- What this file deliberately does NOT include: row-level-security
-- POLICIES and the `ensure_profile_exists` function. Your live project's
-- policies already work in production, and this script has no way to know
-- if a differently-named policy already covers the same case — adding one
-- under a new name would broaden access rather than just "filling a gap".
-- See 0002_rls_reference.sql (in this same folder) for that part, and read
-- its header before ever running it anywhere near production.
--
-- How to run this: Supabase dashboard -> SQL Editor -> paste -> Run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- job_category enum — keep in sync with lib/categories.ts in the app repo
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_category') then
    create type public.job_category as enum (
      'construction', 'engineering', 'it', 'healthcare', 'finance', 'education',
      'retail', 'restaurant', 'manufacturing', 'transportation', 'warehouse',
      'government', 'sales', 'marketing', 'customer_service', 'hr', 'business',
      'legal', 'science', 'real_estate', 'agriculture', 'arts_media', 'security',
      'internships', 'freelance'
    );
  end if;
end $$;

-- If the enum already existed (i.e. the block above was a no-op), make sure
-- every category the app code knows about is at least present as a value —
-- this alone IS safe to run against an existing enum, since it only ever
-- adds a label, never removes or renames one.
do $$
declare
  cat text;
begin
  foreach cat in array array[
    'construction','engineering','it','healthcare','finance','education',
    'retail','restaurant','manufacturing','transportation','warehouse',
    'government','sales','marketing','customer_service','hr','business',
    'legal','science','real_estate','agriculture','arts_media','security',
    'internships','freelance'
  ]
  loop
    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'job_category' and e.enumlabel = cat
    ) then
      execute format('alter type public.job_category add value %L', cat);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- profiles — one row per auth user, says which "app" they belong to
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  user_type text not null default 'applicant' check (user_type in ('company_member', 'applicant')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  billing_customer_id text,
  created_at timestamptz not null default now()
);
alter table public.companies add column if not exists billing_customer_id text;
alter table public.companies add column if not exists plan text not null default 'free';

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'hr_manager')),
  created_at timestamptz not null default now()
);
create index if not exists company_members_company_id_idx on public.company_members (company_id);

-- ---------------------------------------------------------------------
-- applicant_profiles
-- ---------------------------------------------------------------------
create table if not exists public.applicant_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  location text,
  bio text,
  skills text[] not null default '{}',
  resume_text text,
  resume_url text,
  portfolio_url text,
  linkedin_url text,
  availability text,
  desired_salary numeric,
  parsed_experience jsonb not null default '[]',
  parsed_education jsonb not null default '[]',
  parsed_certifications jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.applicant_profiles add column if not exists resume_url text;
alter table public.applicant_profiles add column if not exists portfolio_url text;
alter table public.applicant_profiles add column if not exists linkedin_url text;
alter table public.applicant_profiles add column if not exists availability text;
alter table public.applicant_profiles add column if not exists desired_salary numeric;
alter table public.applicant_profiles add column if not exists parsed_experience jsonb not null default '[]';
alter table public.applicant_profiles add column if not exists parsed_education jsonb not null default '[]';
alter table public.applicant_profiles add column if not exists parsed_certifications jsonb not null default '[]';

-- ---------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  category public.job_category not null,
  location text,
  pay_range text,
  description text,
  requirements text,
  skills text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_reason text,
  closes_at date not null,
  created_at timestamptz not null default now()
);
alter table public.jobs add column if not exists requirements text;
alter table public.jobs add column if not exists skills text[] not null default '{}';
alter table public.jobs add column if not exists closed_reason text;
create index if not exists jobs_company_id_idx on public.jobs (company_id);
create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_category_idx on public.jobs (category);

create table if not exists public.screening_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  question_text text not null,
  answer_type text not null default 'text' check (answer_type in ('text', 'yes_no')),
  order_index integer not null default 0
);
create index if not exists screening_questions_job_id_idx on public.screening_questions (job_id);

-- ---------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  applicant_id uuid not null references public.applicant_profiles (id) on delete cascade,
  status text not null default 'applied' check (status in (
    'applied', 'ai_resume_review', 'recruiter_review', 'hiring_manager_review',
    'interview_requested', 'interview_scheduled', 'interview_completed',
    'final_decision', 'offer_sent', 'hired', 'rejected'
  )),
  match_score integer,
  match_reasoning jsonb,
  ai_summary text,
  created_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);
create index if not exists applications_job_id_idx on public.applications (job_id);
create index if not exists applications_applicant_id_idx on public.applications (applicant_id);

create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  question_id uuid references public.screening_questions (id) on delete set null,
  answer_text text
);
create index if not exists application_answers_application_id_idx on public.application_answers (application_id);

-- ---------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  confirmed_slot timestamptz not null,
  status text not null default 'proposed' check (status in ('proposed', 'scheduled', 'cancelled')),
  confirmation_status text not null default 'awaiting_response' check (confirmation_status in ('awaiting_response', 'confirmed', 'declined')),
  prep_info text,
  created_at timestamptz not null default now()
);
alter table public.interviews add column if not exists prep_info text;
create index if not exists interviews_application_id_idx on public.interviews (application_id);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  channel text not null default 'in_app',
  body text not null,
  related_application_id uuid references public.applications (id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications (user_id, read);

-- ---------------------------------------------------------------------
-- ai_usage_log — daily per-feature rate limiting
-- ---------------------------------------------------------------------
create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action_type text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_log_user_action_idx on public.ai_usage_log (user_id, action_type, created_at);

-- ---------------------------------------------------------------------
-- Enable RLS everywhere (harmless no-op if already on; adds no policies
-- itself, so it does not change who can see what — a table with RLS
-- enabled and zero policies denies all access except to the service role).
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.applicant_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.screening_questions enable row level security;
alter table public.applications enable row level security;
alter table public.application_answers enable row level security;
alter table public.interviews enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_usage_log enable row level security;

-- ---------------------------------------------------------------------
-- 'resumes' storage bucket
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;
