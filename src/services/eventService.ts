import { eventRecords as staticEventRecords } from "../data/events";
import { featureFlags } from "../data/featureFlags";
import type { EventRecord } from "../types";
import { loadCalendarEvents } from "./calendarService";

export interface EventLoadResult {
  events: EventRecord[];
  source: "static" | "ics" | "fallback";
}

export async function loadEventRecords(
  options: { enableIcs?: boolean } = {}
): Promise<EventLoadResult> {
  const enableIcs = options.enableIcs ?? featureFlags.icsCalendar;

  if (!enableIcs) {
    return {
      events: staticEventRecords,
      source: "static"
    };
  }

  const result = await loadCalendarEvents(staticEventRecords);

  return {
    events: result.events,
    source: result.source
  };
}
