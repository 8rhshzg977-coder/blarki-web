-- Fleshes out the company page with the fields real job boards (Indeed,
-- LinkedIn) show: a tagline, industry, size, founding year, HQ, website,
-- a cover banner, and a small photo gallery — on top of the logo +
-- description from 0007. All additive to an existing table, safe to re-run.

alter table public.companies add column if not exists tagline text;
alter table public.companies add column if not exists industry text;
alter table public.companies add column if not exists company_size text;
alter table public.companies add column if not exists founded_year integer;
alter table public.companies add column if not exists headquarters text;
alter table public.companies add column if not exists website_url text;
alter table public.companies add column if not exists cover_url text;
alter table public.companies add column if not exists photos text[] not null default '{}';
