-- Add the Ride Planner difficulty column to existing live events tables.
--
-- The base schema includes this column, but earlier live sync migrations did not
-- add it for projects where public.events already existed.

alter table public.events
  add column if not exists ride_difficulty text;

notify pgrst, 'reload schema';
