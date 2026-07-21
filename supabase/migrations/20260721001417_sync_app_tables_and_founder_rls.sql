-- Sync missing app tables and harden RLS behind founder profiles.
--
-- This closes the live-schema gap where the React app expects branch_assets
-- and operation_items, then applies the PR #1 founder-role gate to every app
-- table. Existing auth users are backfilled as founders to preserve access for
-- the manually-created founder accounts.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.branch_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  preview_url text,
  download_url text,
  preview_surface text,
  updated_at timestamptz default now()
);

create table if not exists public.operation_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  status text not null,
  checklist jsonb default '[]'::jsonb,
  priority text,
  due_date date,
  owner text,
  notes text,
  related_event_id uuid references public.events(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists set_branch_assets_updated_at on public.branch_assets;
create trigger set_branch_assets_updated_at
before update on public.branch_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_operation_items_updated_at on public.operation_items;
create trigger set_operation_items_updated_at
before update on public.operation_items
for each row execute function public.set_updated_at();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('founder', 'member')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

insert into public.profiles (id, role)
select id, 'founder' from auth.users
on conflict (id) do nothing;

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

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'founder'
  );
$$;

revoke all on function public.is_founder() from public;
grant execute on function public.is_founder() to authenticated;

alter table public.events enable row level security;
alter table public.rides enable row level security;
alter table public.branch_assets enable row level security;
alter table public.reference_links enable row level security;
alter table public.operation_items enable row level security;
alter table public.members enable row level security;

revoke all on public.events from anon;
revoke all on public.rides from anon;
revoke all on public.branch_assets from anon;
revoke all on public.reference_links from anon;
revoke all on public.operation_items from anon;
revoke all on public.members from anon;
revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.rides to authenticated;
grant select, insert, update, delete on public.branch_assets to authenticated;
grant select, insert, update, delete on public.reference_links to authenticated;
grant select, insert, update, delete on public.operation_items to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

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
