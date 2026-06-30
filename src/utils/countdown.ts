import type { CountdownDisplay, CountdownStatus, EventRecord } from "../types";
import { daysBetweenDates, parseDate } from "./date";

export function getCountdownDisplay(eventDate: string, today = new Date()): CountdownDisplay {
  const daysRemaining = daysBetweenDates(today, parseDate(eventDate));

  if (daysRemaining === 0) {
    return {
      daysRemaining,
      label: "Today",
      value: "Today",
      unit: "",
      ariaLabel: "Event is today"
    };
  }

  if (daysRemaining === 1) {
    return {
      daysRemaining,
      label: "Tomorrow",
      value: "Tomorrow",
      unit: "",
      ariaLabel: "Event is tomorrow"
    };
  }

  return {
    daysRemaining,
    label: `${daysRemaining} days`,
    value: String(daysRemaining),
    unit: "Days",
    ariaLabel: `Event is in ${daysRemaining} days`
  };
}

export function getUpcomingEventRecords(events: EventRecord[], today = new Date()) {
  return [...events]
    .filter((event) => daysBetweenDates(today, parseDate(event.date)) >= 0)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
}

export function getSidebarCountdown(events: EventRecord[], today = new Date()): CountdownStatus {
  const nextEvent = getUpcomingEventRecords(events, today)[0];

  if (!nextEvent) {
    return {
      eventTitle: "Next Event",
      label: "No upcoming events",
      ariaLabel: "No upcoming events",
      hasEvent: false
    };
  }

  const countdown = getCountdownDisplay(nextEvent.date, today);

  return {
    eventTitle: nextEvent.title,
    label: countdown.label,
    ariaLabel: `${nextEvent.title}: ${countdown.ariaLabel}`,
    hasEvent: true
  };
}
