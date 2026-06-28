# Events Database

This module is the canonical event database for Orange County Litas. It is the single source of truth for chapter events imported from the initial Google Calendar export and for future event records added by leadership.

The database preserves what is known, leaves unknown fields blank, and avoids inventing details that were not present in the calendar source or related chapter records.

## Source

Initial records were created from the Orange County Litas Google Calendar export provided as `basic.ics`.

The import includes Orange County Litas events, OC-owned rides and meetups, and official collaborations or rides to partner/community events when the calendar entry indicates chapter participation. Standalone events clearly hosted by other chapters or outside organizations were excluded when no OC Litas role was documented.

## Database Files

| File | Purpose |
| --- | --- |
| [Events-Index.md](Events-Index.md) | Master index of event records organized by year. |
| [Event-Categories.md](Event-Categories.md) | Category definitions used across the database. |
| [Timeline.md](Timeline.md) | Chronological chapter timeline based on event records. |
| [Statistics.md](Statistics.md) | Automatically summarized event counts and venue patterns. |
| [Templates/Event.md](Templates/Event.md) | Master template for future event records. |

## Year Folders

- [2023](2023/)
- [2024](2024/)
- [2025](2025/)
- [2026](2026/)

## Maintenance Standard

Each event should have its own Markdown file. When leadership learns more about an event, update the event record instead of keeping details only in chat, social captions, or memory.

Future event records should preserve:

- What was announced.
- What actually happened.
- Who hosted or partnered.
- Whether a route, venue, or planning decision should be reused.
- Lessons learned after the event.
- Future notes for repeating or improving the event.

Use this module with [../01-Chapter/Calendar.md](../01-Chapter/Calendar.md), [../02-Events](../02-Events/), [../05-Routes](../05-Routes/), and [../04-Social](../04-Social/) when planning, announcing, riding, recapping, or archiving events.
