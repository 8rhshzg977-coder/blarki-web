-- Team invites (PRD: "Invite teammates by email... Owner + HR Manager is
-- MVP"). New table, so — same reasoning as 0003/0004 — it's safe to
-- include its RLS policies directly here.
--
-- A pending row here is matched by email against a brand-new signup in
-- lib/ensureProfileExists.ts (using the service-role admin client, which
-- is why there's no RLS policy for a non-member to look up their own
-- invite by email — that lookup never goes through the authenticated
-- client).

create table if not exists public.company_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null,
  role text not null default 'hr_manager' check (role in ('owner', 'hr_manager')),
  invited_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists company_invites_email_idx on public.company_invites (lower(email));
create index if not exists company_invites_company_id_idx on public.company_invites (company_id);

alter table public.company_invites enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_invites' and policyname = 'company_invites_select_team') then
    create policy company_invites_select_team on public.company_invites for select using (
      exists (select 1 from public.company_members cm where cm.company_id = company_invites.company_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager'))
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_invites' and policyname = 'company_invites_insert_team') then
    create policy company_invites_insert_team on public.company_invites for insert with check (
      exists (select 1 from public.company_members cm where cm.company_id = company_invites.company_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager'))
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_invites' and policyname = 'company_invites_update_team') then
    create policy company_invites_update_team on public.company_invites for update using (
      exists (select 1 from public.company_members cm where cm.company_id = company_invites.company_id and cm.user_id = auth.uid() and cm.role in ('owner', 'hr_manager'))
    );
  end if;
end $$;
