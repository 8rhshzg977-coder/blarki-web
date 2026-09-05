-- Blarki — row-level-security & RPC reference (NOT verified against production)
--
-- DO NOT paste this whole file into your live Supabase project's SQL editor
-- without reading it first. Unlike 0001_baseline_schema.sql, this file is
-- NOT guaranteed safe to run blind:
--
--   - Your live project's policies already exist and already work — the app
--     is in production. This file is a best-effort reconstruction of what
--     those policies probably are, based only on reading the app code
--     (which tables it reads/writes as which role), not an export of the
--     real policies.
--   - A `create policy` guarded by "skip if a policy with this exact name
--     already exists" does NOT protect you here: if your live project's
--     equivalent policy has a different name, this script won't detect it
--     and will add a second, differently-named policy alongside it.
--     Permissive Postgres RLS policies combine with OR — so that second
--     policy doesn't get ignored, it can genuinely widen access beyond
--     what you currently have live.
--
-- When this file IS safe to use as-is: a brand new Supabase project with
-- empty tables — a staging environment, or if you ever need to rebuild
-- from scratch. In that case, run 0001 then this file, in order.
--
-- When you want this for your EXISTING live project: read each policy
-- below, compare it to what's actually in Supabase Dashboard -> Database ->
-- Policies for that table, and only add the ones that are genuinely
-- missing — ideally by hand, one at a time, checking the app still works
-- after each.

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

-- ---------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------
create policy companies_select_member on public.companies for select using (
  exists (select 1 from public.company_members cm where cm.company_id = companies.id and cm.user_id = auth.uid())
);
create policy companies_insert_authenticated on public.companies for insert to authenticated with check (true);
create policy companies_update_owner on public.companies for update using (
  exists (select 1 from public.company_members cm where cm.company_id = companies.id and cm.user_id = auth.uid() and cm.role = 'owner')
);

-- ---------------------------------------------------------------------
-- company_members
-- ---------------------------------------------------------------------
create policy company_members_select_same_company on public.company_members for select using (
  user_id = auth.uid()
  or exists (select 1 from public.company_members cm2 where cm2.company_id = company_members.company_id and cm2.user_id = auth.uid())
);
create policy company_members_insert_own on public.company_members for insert with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- applicant_profiles
-- ---------------------------------------------------------------------
create policy applicant_profiles_select_own on public.applicant_profiles for select using (user_id = auth.uid());
create policy applicant_profiles_insert_own on public.applicant_profiles for insert with check (user_id = auth.uid());
create policy applicant_profiles_update_own on public.applicant_profiles for update using (user_id = auth.uid());
-- A company can see the profile of anyone who applied to one of its jobs.
create policy applicant_profiles_select_by_hiring_company on public.applicant_profiles for select using (
  exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.company_members cm on cm.company_id = j.company_id
    where a.applicant_id = applicant_profiles.id and cm.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- jobs — publicly readable while open, always readable by the owning company
-- ---------------------------------------------------------------------
create policy jobs_select_public_or_company on public.jobs for select using (
  status = 'open'
  or exists (select 1 from public.company_members cm where cm.company_id = jobs.company_id and cm.user_id = auth.uid())
);
create policy jobs_insert_company on public.jobs for insert with check (
  exists (select 1 from public.company_members cm where cm.company_id = jobs.company_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager'))
);
create policy jobs_update_company on public.jobs for update using (
  exists (select 1 from public.company_members cm where cm.company_id = jobs.company_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager'))
);
create policy jobs_delete_company on public.jobs for delete using (
  exists (select 1 from public.company_members cm where cm.company_id = jobs.company_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager'))
);

-- ---------------------------------------------------------------------
-- screening_questions — same visibility rule as the job they belong to
-- ---------------------------------------------------------------------
create policy screening_questions_select on public.screening_questions for select using (
  exists (
    select 1 from public.jobs j
    where j.id = screening_questions.job_id
      and (j.status = 'open' or exists (select 1 from public.company_members cm where cm.company_id = j.company_id and cm.user_id = auth.uid()))
  )
);
create policy screening_questions_insert on public.screening_questions for insert with check (
  exists (
    select 1 from public.jobs j
    join public.company_members cm on cm.company_id = j.company_id
    where j.id = screening_questions.job_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager')
  )
);
create policy screening_questions_delete on public.screening_questions for delete using (
  exists (
    select 1 from public.jobs j
    join public.company_members cm on cm.company_id = j.company_id
    where j.id = screening_questions.job_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager')
  )
);

-- ---------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------
create policy applications_select on public.applications for select using (
  exists (select 1 from public.applicant_profiles ap where ap.id = applications.applicant_id and ap.user_id = auth.uid())
  or exists (
    select 1 from public.jobs j
    join public.company_members cm on cm.company_id = j.company_id
    where j.id = applications.job_id and cm.user_id = auth.uid()
  )
);
create policy applications_insert_own on public.applications for insert with check (
  exists (select 1 from public.applicant_profiles ap where ap.id = applications.applicant_id and ap.user_id = auth.uid())
);
create policy applications_update_company on public.applications for update using (
  exists (
    select 1 from public.jobs j
    join public.company_members cm on cm.company_id = j.company_id
    where j.id = applications.job_id and cm.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- application_answers
-- ---------------------------------------------------------------------
create policy application_answers_select on public.application_answers for select using (
  exists (
    select 1 from public.applications a
    join public.applicant_profiles ap on ap.id = a.applicant_id
    where a.id = application_answers.application_id and ap.user_id = auth.uid()
  )
  or exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.company_members cm on cm.company_id = j.company_id
    where a.id = application_answers.application_id and cm.user_id = auth.uid()
  )
);
create policy application_answers_insert_own on public.application_answers for insert with check (
  exists (
    select 1 from public.applications a
    join public.applicant_profiles ap on ap.id = a.applicant_id
    where a.id = application_answers.application_id and ap.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------
create policy interviews_select on public.interviews for select using (
  exists (
    select 1 from public.applications a
    join public.applicant_profiles ap on ap.id = a.applicant_id
    where a.id = interviews.application_id and ap.user_id = auth.uid()
  )
  or exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.company_members cm on cm.company_id = j.company_id
    where a.id = interviews.application_id and cm.user_id = auth.uid()
  )
);
create policy interviews_insert_company on public.interviews for insert with check (
  exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.company_members cm on cm.company_id = j.company_id
    where a.id = interviews.application_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager')
  )
);
create policy interviews_update on public.interviews for update using (
  exists (
    select 1 from public.applications a
    join public.applicant_profiles ap on ap.id = a.applicant_id
    where a.id = interviews.application_id and ap.user_id = auth.uid()
  )
  or exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.company_members cm on cm.company_id = j.company_id
    where a.id = interviews.application_id and cm.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- notifications — users only ever see/update their own; all inserts in the
-- app go through the service-role client, which bypasses RLS entirely, so
-- no insert policy is needed here.
-- ---------------------------------------------------------------------
create policy notifications_select_own on public.notifications for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update using (user_id = auth.uid());

-- ai_usage_log has no policies at all — every read/write in the app goes
-- through the service-role client, so RLS-with-zero-policies (deny all to
-- regular users) is the correct, already-safe state. Nothing to add here.

-- ---------------------------------------------------------------------
-- storage: 'resumes' bucket — public read (matches getPublicUrl() usage in
-- the app), authenticated users may only write into their own uid/ folder.
-- ---------------------------------------------------------------------
create policy resumes_public_read on storage.objects for select using (bucket_id = 'resumes');
create policy resumes_owner_write on storage.objects for insert to authenticated with check (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy resumes_owner_update on storage.objects for update to authenticated using (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------
-- ensure_profile_exists(p_user_type) — self-heal RPC referenced from
-- app/dashboard/applicant/profile/actions.ts. Runs as the calling user
-- (security definer, but scoped to auth.uid()), so it can insert a missing
-- profiles row even where a table-level INSERT policy might not exist yet.
-- ---------------------------------------------------------------------
create or replace function public.ensure_profile_exists(p_user_type text default 'applicant')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, user_type)
  select auth.uid(), u.email, p_user_type
  from auth.users u
  where u.id = auth.uid()
    and not exists (select 1 from public.profiles p where p.id = auth.uid());
end;
$$;
