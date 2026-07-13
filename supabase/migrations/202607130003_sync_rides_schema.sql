-- Sync live Rides table with the current Ride Planner save payload.
--
-- This fixes Ride Planner saves falling back because the deployed rides table
-- is missing currently editable fields such as status.

create extension if not exists "pgcrypto";

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.rides
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists title text,
  add column if not exists date date,
  add column if not exists status text,
  add column if not exists meetup text,
  add column if not exists destination text,
  add column if not exists mileage text,
  add column if not exists duration text,
  add column if not exists difficulty text,
  add column if not exists ride_leader text,
  add column if not exists sweep text,
  add column if not exists estimated_distance text,
  add column if not exists estimated_ride_time text,
  add column if not exists freeways boolean default false,
  add column if not exists meetup_time time,
  add column if not exists starting_location text,
  add column if not exists kickstands_up text,
  add column if not exists primary_route_link text,
  add column if not exists alternative_route_link text,
  add column if not exists total_distance text,
  add column if not exists route_duration text,
  add column if not exists ride_type text,
  add column if not exists visibility text,
  add column if not exists weather_policy text,
  add column if not exists stops jsonb default '[]'::jsonb,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_rides_updated_at on public.rides;
create trigger set_rides_updated_at
before update on public.rides
for each row execute function public.set_updated_at();

alter table public.rides enable row level security;

revoke all on public.rides from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.rides to authenticated;

drop policy if exists "founders can manage rides" on public.rides;
create policy "founders can manage rides"
on public.rides
for all
to authenticated
using (true)
with check (true);

notify pgrst, 'reload schema';
