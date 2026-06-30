import type { CountdownDisplay, CountdownStatus, EventRecord } from "../types";
import { daysBetweenDates, parseDate } from "./date";

export function getCountdownLabel(eventDate: string, today = new Date()): string {
  const daysRemaining = daysBetweenDates(today, parseDate(eventDate));

  if (daysRemaining === 0) {
    return "Today";
  }

  if (daysRemaining === 1) {
    return "Tomorrow";
  }

  return `${daysRemaining} days`;
}

export function getCountdownDisplay(eventDate: string, today = new Date()): CountdownDisplay {
  const daysRemaining = daysBetweenDates(today, parseDate(eventDate));
  const label = getCountdownLabel(eventDate, today);

  if (daysRemaining === 0) {
    return {
      daysRemaining,
      label,
      value: "Today",
      unit: "",
      ariaLabel: "Event is today"
    };
  }

  if (daysRemaining === 1) {
    return {
      daysRemaining,
      label,
      value: "Tomorrow",
      unit: "",
      ariaLabel: "Event is tomorrow"
    };
  }

  return {
    daysRemaining,
    label,
    value: String(daysRemaining),
    unit: "Days",
    ariaLabel: `Event is in ${daysRemaining} days`
  };
}

export function getUpcomingEvents(events: EventRecord[], today = new Date()) {
  return [...events]
    .filter((event) => daysBetweenDates(today, parseDate(event.startDate)) >= 0)
    .sort((a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime());
}

export function getNextEvent(events: EventRecord[], today = new Date()) {
  return getUpcomingEvents(events, today)[0] ?? null;
}

export function getSidebarCountdown(nextEvent: EventRecord | null, today = new Date()): CountdownStatus {
  if (!nextEvent) {
    return {
      eventTitle: "Next Event",
      label: "No upcoming events",
      ariaLabel: "No upcoming events",
      hasEvent: false
    };
  }

  const countdown = getCountdownDisplay(nextEvent.startDate, today);

  return {
    eventTitle: nextEvent.title,
    label: countdown.label,
    ariaLabel: `${nextEvent.title}: ${countdown.ariaLabel}`,
    hasEvent: true
  };
}
