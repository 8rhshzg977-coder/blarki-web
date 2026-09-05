-- Saved jobs — lets an applicant bookmark a job to come back to later.
-- New table, so (unlike 0002_rls_reference.sql) it's safe to include its
-- RLS policies directly here: there's no existing live policy on a table
-- that doesn't exist yet to accidentally duplicate or widen. Guarded with
-- IF NOT EXISTS / pg_policies checks anyway so this file can be re-run
-- without erroring.

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicant_profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (applicant_id, job_id)
);
create index if not exists saved_jobs_applicant_id_idx on public.saved_jobs (applicant_id);

alter table public.saved_jobs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_jobs' and policyname = 'saved_jobs_select_own') then
    create policy saved_jobs_select_own on public.saved_jobs for select using (
      exists (select 1 from public.applicant_profiles ap where ap.id = saved_jobs.applicant_id and ap.user_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_jobs' and policyname = 'saved_jobs_insert_own') then
    create policy saved_jobs_insert_own on public.saved_jobs for insert with check (
      exists (select 1 from public.applicant_profiles ap where ap.id = saved_jobs.applicant_id and ap.user_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_jobs' and policyname = 'saved_jobs_delete_own') then
    create policy saved_jobs_delete_own on public.saved_jobs for delete using (
      exists (select 1 from public.applicant_profiles ap where ap.id = saved_jobs.applicant_id and ap.user_id = auth.uid())
    );
  end if;
end $$;
