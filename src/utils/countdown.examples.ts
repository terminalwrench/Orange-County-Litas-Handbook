import type { EventRecord } from "../types";
import { getCountdownLabel, getNextEvent, getUpcomingEvents } from "./countdown";
import { parseDate } from "./date";

const exampleEvents = [
  { id: "past", title: "Past Event", date: "2026-06-01" },
  { id: "next", title: "Old World Meet & Greet", date: "2026-07-09" },
  { id: "later", title: "Later Event", date: "2026-07-25" }
] as EventRecord[];

export const countdownDebugExamples = {
  june29ToJuly9: getCountdownLabel("2026-07-09", parseDate("2026-06-29")),
  today: getCountdownLabel("2026-07-09", parseDate("2026-07-09")),
  tomorrow: getCountdownLabel("2026-07-09", parseDate("2026-07-08")),
  nextEventId: getNextEvent(exampleEvents, parseDate("2026-06-29"))?.id,
  upcomingEventIds: getUpcomingEvents(exampleEvents, parseDate("2026-06-29")).map((event) => event.id)
} as const;
