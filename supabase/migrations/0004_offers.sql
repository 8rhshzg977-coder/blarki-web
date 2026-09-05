-- Formal offers — turns "Offer sent" from a bare status label into a real
-- step: a start date and a next-steps message from the employer, which the
-- applicant explicitly accepts or declines (matching how real hiring
-- platforms handle this, rather than an employer unilaterally flipping a
-- status to "Hired" with no detail on the applicant's side).
--
-- New table, so — like 0003_saved_jobs.sql — its RLS policies are included
-- directly and are safe to run as-is against the live database.

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  start_date date,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create index if not exists offers_application_id_idx on public.offers (application_id);

alter table public.offers enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'offers' and policyname = 'offers_select') then
    create policy offers_select on public.offers for select using (
      exists (
        select 1 from public.applications a
        join public.applicant_profiles ap on ap.id = a.applicant_id
        where a.id = offers.application_id and ap.user_id = auth.uid()
      )
      or exists (
        select 1 from public.applications a
        join public.jobs j on j.id = a.job_id
        join public.company_members cm on cm.company_id = j.company_id
        where a.id = offers.application_id and cm.user_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'offers' and policyname = 'offers_insert_company') then
    create policy offers_insert_company on public.offers for insert with check (
      exists (
        select 1 from public.applications a
        join public.jobs j on j.id = a.job_id
        join public.company_members cm on cm.company_id = j.company_id
        where a.id = offers.application_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager')
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'offers' and policyname = 'offers_update') then
    create policy offers_update on public.offers for update using (
      exists (
        select 1 from public.applications a
        join public.applicant_profiles ap on ap.id = a.applicant_id
        where a.id = offers.application_id and ap.user_id = auth.uid()
      )
      or exists (
        select 1 from public.applications a
        join public.jobs j on j.id = a.job_id
        join public.company_members cm on cm.company_id = j.company_id
        where a.id = offers.application_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager')
      )
    );
  end if;
end $$;
