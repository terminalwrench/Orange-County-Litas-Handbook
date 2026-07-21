-- Harden Row Level Security with a founder-role check (defense in depth).
--
-- Background:
-- Every table policy was previously `for all to authenticated using (true)
-- with check (true)`. That is only safe because public signup is disabled and
-- accounts are hand-created by the founders. If signup were ever enabled in the
-- Supabase dashboard, ANY signed-up user would gain full read/write on every
-- table.
--
-- New invariant:
-- Access to the app tables now requires the caller's profile role to be
-- 'founder'. A `public.profiles` row is keyed to auth.users(id):
--   * All existing auth users are backfilled to 'founder' (current accounts are
--     all hand-created founders), so the app keeps working unchanged.
--   * Any NEW auth user is provisioned with role 'member' by default and has NO
--     access until a founder promotes them. Enabling public signup therefore no
--     longer exposes the data.
-- Promote a user with:
--   update public.profiles set role = 'founder' where id = '<auth-user-uuid>';

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('founder', 'member')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Keep updated_at fresh (reuses the shared trigger function from schema.sql).
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Backfill: every current authenticated account is an existing founder.
insert into public.profiles (id, role)
select id, 'founder' from auth.users
on conflict (id) do nothing;

-- Provision a profile (defaulting to the non-privileged 'member' role) whenever
-- a new auth user is created, so future signups are denied by default.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- SECURITY DEFINER so the check reads profiles without recursing through the
-- profiles RLS policy or requiring the caller to hold direct table grants.
create or replace function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'founder'
  );
$$;

grant execute on function public.is_founder() to authenticated;

-- Callers may read their own profile row; no direct writes via the client.
grant select on public.profiles to authenticated;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Replace the blanket `using (true)` policies with founder-role checks.
drop policy if exists "founders can manage events" on public.events;
create policy "founders can manage events"
on public.events
for all
to authenticated
using (public.is_founder())
with check (public.is_founder());

drop policy if exists "founders can manage rides" on public.rides;
create policy "founders can manage rides"
on public.rides
for all
to authenticated
using (public.is_founder())
with check (public.is_founder());

drop policy if exists "founders can manage branch assets" on public.branch_assets;
create policy "founders can manage branch assets"
on public.branch_assets
for all
to authenticated
using (public.is_founder())
with check (public.is_founder());

drop policy if exists "founders can manage reference links" on public.reference_links;
create policy "founders can manage reference links"
on public.reference_links
for all
to authenticated
using (public.is_founder())
with check (public.is_founder());

drop policy if exists "founders can manage operation items" on public.operation_items;
create policy "founders can manage operation items"
on public.operation_items
for all
to authenticated
using (public.is_founder())
with check (public.is_founder());

drop policy if exists "founders can manage members" on public.members;
create policy "founders can manage members"
on public.members
for all
to authenticated
using (public.is_founder())
with check (public.is_founder());

notify pgrst, 'reload schema';
