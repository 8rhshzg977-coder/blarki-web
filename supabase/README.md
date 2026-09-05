# Database schema — version control

Until now, the database schema for this app only existed inside the live
Supabase project — nothing was checked into git, so there was no history,
no way to review a schema change before it went live, and no way to spin up
a second (staging) environment that matched production.

This folder is the start of fixing that.

## Files

- **`migrations/0001_baseline_schema.sql`** — tables, columns, indexes, and
  the `job_category` enum, reconstructed by reading the app code (every
  `.from('table')` call across the repo). **Safe to run against your
  existing live project right now** — every statement is written to only
  add something that's missing, and never touches a table, column, or row
  that already exists. See the comments at the top of the file for exactly
  why it's safe.

- **`migrations/0002_rls_reference.sql`** — the row-level-security policies
  and the `ensure_profile_exists` database function, reconstructed the same
  way. **This one is NOT verified safe to run against your live project as-is**
  — read its header comment before touching it. It's meant for a brand-new
  (empty) Supabase project; for your existing one, use it as a checklist to
  compare against Dashboard → Database → Policies, not as a script to paste
  and run blind.

## How to run a migration

1. Go to your Supabase project → **SQL Editor**.
2. Open the migration file, copy its contents, paste into a new query.
3. Click **Run**.

If `0001` ever errors partway through on the `job_category` enum section
(some Postgres versions are picky about adding enum values and using them
in the same transaction), just run that first `do $$ ... $$` block on its
own, then paste and run the rest of the file separately.

## Going forward

Any future schema change (a new table, a new column, a new policy) should
get its own file in `migrations/`, numbered after the last one
(`0003_...sql`, `0004_...sql`), so the history of *why* the database looks
the way it does lives in git next to the code that depends on it — not only
in whatever you happened to click in the Supabase dashboard.
