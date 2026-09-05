-- Public company page (PRD: "Every company gets a page inside the platform
-- — effectively a mini company website. Simple version is MVP (logo,
-- description, photos, open jobs — the trust argument)"). Scoped here to
-- logo + description + open jobs; a full photo gallery is left for later,
-- same MVP-vs-V2 line the PRD itself draws for the richer version.

alter table public.companies add column if not exists description text;
alter table public.companies add column if not exists logo_url text;

-- New bucket, so — same reasoning as the 'resumes' bucket in 0001 — safe to
-- include its policies directly here.
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'company_logos_public_read') then
    create policy company_logos_public_read on storage.objects for select using (bucket_id = 'company-logos');
  end if;

  -- Uploads are keyed by company_id folder (company-logos/<company_id>/...),
  -- same convention as resumes/<user_id>/... — lets these policies check
  -- ownership straight off the storage path.
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'company_logos_team_write') then
    create policy company_logos_team_write on storage.objects for insert to authenticated with check (
      bucket_id = 'company-logos' and exists (
        select 1 from public.company_members cm
        where cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager')
          and cm.company_id::text = (storage.foldername(name))[1]
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'company_logos_team_update') then
    create policy company_logos_team_update on storage.objects for update to authenticated using (
      bucket_id = 'company-logos' and exists (
        select 1 from public.company_members cm
        where cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager')
          and cm.company_id::text = (storage.foldername(name))[1]
      )
    );
  end if;
end $$;
