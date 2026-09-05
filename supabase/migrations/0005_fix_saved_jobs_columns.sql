-- Fix for a pre-existing saved_jobs table that predates 0003_saved_jobs.sql.
-- That migration used `create table if not exists`, which saw a table
-- already named saved_jobs (with only applicant_id/job_id, no id or
-- created_at) and skipped creating the intended one — silently leaving the
-- old shape in place. The app's code assumes an `id` primary key on every
-- row it selects, so it was failing with a "column does not exist" error
-- that our own error handling mislabeled as "table not set up."
--
-- This adds what's missing without touching any existing rows. Safe to
-- re-run — every step is guarded.

alter table public.saved_jobs add column if not exists id uuid default gen_random_uuid();
update public.saved_jobs set id = gen_random_uuid() where id is null;
alter table public.saved_jobs alter column id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conrelid = 'public.saved_jobs'::regclass and contype = 'p'
  ) then
    alter table public.saved_jobs add primary key (id);
  end if;
end $$;

alter table public.saved_jobs add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conrelid = 'public.saved_jobs'::regclass and contype = 'u'
  ) then
    alter table public.saved_jobs add constraint saved_jobs_applicant_id_job_id_key unique (applicant_id, job_id);
  end if;
end $$;

create index if not exists saved_jobs_applicant_id_idx on public.saved_jobs (applicant_id);

-- Force PostgREST to pick up the new columns immediately rather than
-- waiting on its next automatic schema-cache refresh.
notify pgrst, 'reload schema';
