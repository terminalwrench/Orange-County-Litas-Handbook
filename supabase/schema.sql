-- Orange County Litas Operations Center
-- Initial Supabase schema for the lightweight internal operations app.
--
-- Auth note:
-- This portal is founder/admin only. Create users manually in Supabase Auth.
-- RLS below denies unauthenticated access and allows authenticated portal users
-- to manage the app tables. If public signup is ever enabled, replace these
-- simple authenticated policies with app_metadata/profile-based authorization.

create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  start_date date not null,
  end_date date,
  time text,
  location text,
  city text,
  description text,
  status text,
  flyer_status text,
  ride_difficulty text,
  venue_confirmed boolean default false,
  route_complete boolean default false,
  flyer_posted boolean default false,
  email_sent boolean default false,
  flyer_url text,
  group_photo_url text,
  route_image_url text,
  instagram_url text,
  apple_album_url text,
  notes text,
  external_uid text,
  source text default 'supabase',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists events_external_uid_key
on public.events (external_uid)
where external_uid is not null;

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  date date,
  status text,
  meetup text,
  destination text,
  mileage text,
  duration text,
  difficulty text,
  ride_leader text,
  sweep text,
  estimated_distance text,
  estimated_ride_time text,
  freeways boolean default false,
  starting_location text,
  kickstands_up text,
  primary_route_link text,
  alternative_route_link text,
  total_distance text,
  route_duration text,
  ride_type text,
  visibility text,
  weather_policy text,
  stops jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create table if not exists public.reference_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  url text,
  target_id text,
  icon text,
  created_at timestamptz default now(),
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

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_initial text,
  birthday_month integer,
  birthday_day integer,
  instagram_handle text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.members
  add column if not exists first_name text,
  add column if not exists last_initial text,
  add column if not exists birthday_month integer,
  add column if not exists birthday_day integer,
  add column if not exists instagram_handle text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists members_birthday_month_day_idx
on public.members (birthday_month, birthday_day)
where birthday_month is not null and birthday_day is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'members_birthday_month_check'
  ) then
    alter table public.members
      add constraint members_birthday_month_check
      check (birthday_month is null or birthday_month between 1 and 12);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'members_birthday_day_check'
  ) then
    alter table public.members
      add constraint members_birthday_day_check
      check (
        birthday_day is null
        or (
          birthday_day >= 1
          and birthday_day <= case
            when birthday_month = 2 then 29
            when birthday_month in (4, 6, 9, 11) then 30
            else 31
          end
        )
      );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_rides_updated_at on public.rides;
create trigger set_rides_updated_at
before update on public.rides
for each row execute function public.set_updated_at();

drop trigger if exists set_branch_assets_updated_at on public.branch_assets;
create trigger set_branch_assets_updated_at
before update on public.branch_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_reference_links_updated_at on public.reference_links;
create trigger set_reference_links_updated_at
before update on public.reference_links
for each row execute function public.set_updated_at();

drop trigger if exists set_operation_items_updated_at on public.operation_items;
create trigger set_operation_items_updated_at
before update on public.operation_items
for each row execute function public.set_updated_at();

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
before update on public.members
for each row execute function public.set_updated_at();

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

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.rides to authenticated;
grant select, insert, update, delete on public.branch_assets to authenticated;
grant select, insert, update, delete on public.reference_links to authenticated;
grant select, insert, update, delete on public.operation_items to authenticated;
grant select, insert, update, delete on public.members to authenticated;

drop policy if exists "founders can manage events" on public.events;
create policy "founders can manage events"
on public.events
for all
to authenticated
using (true)
with check (true);

drop policy if exists "founders can manage rides" on public.rides;
create policy "founders can manage rides"
on public.rides
for all
to authenticated
using (true)
with check (true);

drop policy if exists "founders can manage branch assets" on public.branch_assets;
create policy "founders can manage branch assets"
on public.branch_assets
for all
to authenticated
using (true)
with check (true);

drop policy if exists "founders can manage reference links" on public.reference_links;
create policy "founders can manage reference links"
on public.reference_links
for all
to authenticated
using (true)
with check (true);

drop policy if exists "founders can manage operation items" on public.operation_items;
create policy "founders can manage operation items"
on public.operation_items
for all
to authenticated
using (true)
with check (true);

drop policy if exists "founders can manage members" on public.members;
create policy "founders can manage members"
on public.members
for all
to authenticated
using (true)
with check (true);
