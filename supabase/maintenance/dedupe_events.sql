-- Events duplicate audit / optional cleanup.
--
-- This file is intentionally not a migration and should not run automatically.
-- Use it manually in the Supabase SQL editor if duplicate live event rows need
-- to be inspected or cleaned up.
--
-- Step 1: inspect likely duplicates.
with ranked_events as (
  select
    id,
    title,
    start_date,
    end_date,
    time,
    location,
    city,
    type,
    external_uid,
    created_at,
    updated_at,
    row_number() over (
      partition by coalesce(
        external_uid,
        lower(trim(title)) || '|' ||
        start_date::text || '|' ||
        coalesce(end_date::text, start_date::text) || '|' ||
        lower(trim(coalesce(time, ''))) || '|' ||
        lower(trim(coalesce(location, ''))) || '|' ||
        lower(trim(coalesce(city, ''))) || '|' ||
        lower(trim(coalesce(type, '')))
      )
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as duplicate_rank
  from public.events
)
select *
from ranked_events
where duplicate_rank > 1
order by start_date desc, title;

-- Step 2: after reviewing the rows above, uncomment this delete if the
-- duplicate_rank > 1 rows are confirmed accidental duplicates.
--
-- with ranked_events as (
--   select
--     id,
--     row_number() over (
--       partition by coalesce(
--         external_uid,
--         lower(trim(title)) || '|' ||
--         start_date::text || '|' ||
--         coalesce(end_date::text, start_date::text) || '|' ||
--         lower(trim(coalesce(time, ''))) || '|' ||
--         lower(trim(coalesce(location, ''))) || '|' ||
--         lower(trim(coalesce(city, ''))) || '|' ||
--         lower(trim(coalesce(type, '')))
--       )
--       order by updated_at desc nulls last, created_at desc nulls last, id desc
--     ) as duplicate_rank
--   from public.events
-- )
-- delete from public.events
-- using ranked_events
-- where public.events.id = ranked_events.id
--   and ranked_events.duplicate_rank > 1;
