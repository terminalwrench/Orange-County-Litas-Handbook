-- Sync live Events and Members tables with the current Operations Center app.
--
-- This fixes two runtime failures:
-- 1. Calendar imports failing because public.events is missing newer app columns.
-- 2. Birthday saves failing because public.members is missing from the API schema.

create extension if not exists "pgcrypto";

alter table public.events
  add column if not exists venue_confirmed boolean default false,
  add column if not exists route_complete boolean default false,
  add column if not exists flyer_posted boolean default false,
  add column if not exists email_sent boolean default false,
  add column if not exists flyer_url text,
  add column if not exists group_photo_url text,
  add column if not exists route_image_url text,
  add column if not exists instagram_url text,
  add column if not exists apple_album_url text,
  add column if not exists external_uid text,
  add column if not exists source text default 'supabase',
  add column if not exists updated_at timestamptz default now();

create unique index if not exists events_external_uid_key
on public.events (external_uid)
where external_uid is not null;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  first_name text,
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

create index if not exists members_birthday_month_day_idx
on public.members (birthday_month, birthday_day)
where birthday_month is not null and birthday_day is not null;

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

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
before update on public.members
for each row execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.members enable row level security;

revoke all on public.events from anon;
revoke all on public.members from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.members to authenticated;

drop policy if exists "founders can manage events" on public.events;
create policy "founders can manage events"
on public.events
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

notify pgrst, 'reload schema';
