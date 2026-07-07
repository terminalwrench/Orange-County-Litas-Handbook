-- Orange County Litas Operations Center
-- Initial Supabase schema for the lightweight internal operations app.
--
-- Local-development note:
-- This milestone intentionally keeps access simple while the app has no auth.
-- Enable Row Level Security and add authenticated policies before introducing
-- Supabase Auth, public deployment writes, or broader user access.

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
  meetup text,
  destination text,
  mileage text,
  duration text,
  difficulty text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  status text,
  related_event_id uuid references public.events(id) on delete set null,
  date date,
  url text,
  preview_surface text,
  storage_path text,
  notes text,
  created_at timestamptz default now(),
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
  priority text,
  due_date date,
  owner text,
  notes text,
  related_event_id uuid references public.events(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_reference_links_updated_at on public.reference_links;
create trigger set_reference_links_updated_at
before update on public.reference_links
for each row execute function public.set_updated_at();

drop trigger if exists set_operation_items_updated_at on public.operation_items;
create trigger set_operation_items_updated_at
before update on public.operation_items
for each row execute function public.set_updated_at();

-- RLS should be enabled when authentication is added.
-- Example future step:
-- alter table public.events enable row level security;
-- alter table public.rides enable row level security;
-- alter table public.media_assets enable row level security;
-- alter table public.reference_links enable row level security;
-- alter table public.operation_items enable row level security;
