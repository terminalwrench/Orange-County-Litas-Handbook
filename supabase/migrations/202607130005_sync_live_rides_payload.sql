-- Sync the live rides table with the current Ride Planner save payload.
--
-- Earlier projects may have public.rides with only the legacy columns:
-- id, event_id, title, date, meetup, destination, mileage, duration,
-- difficulty, notes, created_at, updated_at.

alter table public.rides
  add column if not exists status text,
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
  add column if not exists stops jsonb default '[]'::jsonb;

notify pgrst, 'reload schema';
