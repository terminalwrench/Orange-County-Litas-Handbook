import { eventRecords as staticEventRecords } from "../data/events";
import { featureFlags } from "../data/featureFlags";
import type { DashboardEvent, EventRecord, RideWeather, UpcomingEvent, CountdownStatus } from "../types";
import { getCountdownDisplay, getCountdownLabel as getCountdownLabelValue, getSidebarCountdown } from "../utils/countdown";
import { isWithinCurrentWeek, parseDate, toDateValue } from "../utils/date";
import { loadCalendarEvents } from "./calendarService";

const rideWeatherForecast = {
  temperature: "72°",
  condition: "Sunny",
  rain: "0%",
  wind: "18 mph",
  humidity: "64%"
};

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short"
});

const dateLineFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric"
});

export interface EventLoadResult {
  events: EventRecord[];
  source: "static" | "ics" | "fallback";
}

export interface EventDashboardData {
  eventRecords: EventRecord[];
  nextEvent: DashboardEvent | null;
  upcomingEvents: UpcomingEvent[];
  sidebarCountdown: CountdownStatus;
  rideWeather: RideWeather | null;
}

export function getEvents(): EventRecord[] {
  return staticEventRecords;
}

export async function loadEventRecords(
  options: { enableIcs?: boolean } = {}
): Promise<EventLoadResult> {
  const enableIcs = options.enableIcs ?? featureFlags.icsCalendar;

  if (!enableIcs) {
    return {
      events: getEvents(),
      source: "static"
    };
  }

  const result = await loadCalendarEvents(getEvents());

  return {
    events: result.events,
    source: result.source
  };
}

export function getUpcomingEvents(events: EventRecord[] = getEvents(), today = new Date()) {
  return [...events]
    .filter((event) => daysUntil(event, today) >= 0)
    .sort((a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime());
}

export function getPastEvents(events: EventRecord[] = getEvents(), today = new Date()) {
  return [...events]
    .filter((event) => daysUntil(event, today) < 0)
    .sort((a, b) => parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime());
}

export function getNextEvent(events: EventRecord[] = getEvents(), today = new Date()) {
  return getUpcomingEvents(events, today)[0] ?? null;
}

export function getCountdownLabel(eventDate: string, today = new Date()) {
  return getCountdownLabelValue(eventDate, today);
}

export function isRideEvent(event: EventRecord) {
  return `${event.title} ${event.type}`.toLowerCase().includes("ride");
}

export function getNextRideEvent(events: EventRecord[] = getEvents(), today = new Date()) {
  return getUpcomingEvents(events, today).find(isRideEvent) ?? null;
}

export function buildEventDashboardData(
  records: EventRecord[],
  today = new Date()
): EventDashboardData {
  const upcomingEventRecords = getUpcomingEvents(records, today);
  const nextEventRecord = getNextEvent(records, today);
  const nextRideRecord = upcomingEventRecords.find(isRideEvent) ?? null;

  return {
    eventRecords: records,
    nextEvent: nextEventRecord ? toDashboardEvent(nextEventRecord, today) : null,
    upcomingEvents: upcomingEventRecords.slice(1, 4).map(toUpcomingEvent),
    sidebarCountdown: getSidebarCountdown(nextEventRecord, today),
    rideWeather: toRideWeather(nextRideRecord, today)
  };
}

function daysUntil(event: EventRecord, today: Date) {
  const eventDate = parseDate(event.startDate);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  return Math.round((end - start) / 86_400_000);
}

function getMonth(date: string) {
  return shortDateFormatter.format(parseDate(date)).split(" ")[0];
}

function getDay(date: string) {
  return String(parseDate(date).getDate());
}

function toDashboardEvent(event: EventRecord, today = new Date()): DashboardEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.startDate,
    month: getMonth(event.startDate),
    day: getDay(event.startDate),
    weekday: weekdayFormatter.format(parseDate(event.startDate)),
    time: event.time,
    dateLine: dateLineFormatter.format(parseDate(event.startDate)),
    venue: event.location,
    city: event.city,
    countdown: getCountdownDisplay(event.startDate, today),
    checklist: event.checklist,
    category: event.type
  };
}

function toUpcomingEvent(event: EventRecord): UpcomingEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.startDate,
    month: getMonth(event.startDate),
    day: getDay(event.startDate),
    time: event.time,
    type: event.type
  };
}

function toRideWeather(event: EventRecord | null, today = new Date()): RideWeather | null {
  if (!event) return null;

  return {
    eventDate: event.startDate,
    label: `Ride Weather (${dateLineFormatter.format(parseDate(event.startDate))})`,
    isForecastAvailable: isWithinCurrentWeek(event.startDate, toDateValue(today)),
    ...rideWeatherForecast
  };
}
