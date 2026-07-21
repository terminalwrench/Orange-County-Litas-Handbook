-- Add founder-managed member import fields.
-- These are member records only; they do not create Supabase Auth users.

alter table public.members
  add column if not exists last_name text,
  add column if not exists email text,
  add column if not exists phone_number text,
  add column if not exists member_role text,
  add column if not exists date_joined date;

create unique index if not exists members_email_key
on public.members (email)
where email is not null;

create index if not exists members_date_joined_idx
on public.members (date_joined)
where date_joined is not null;

notify pgrst, 'reload schema';
