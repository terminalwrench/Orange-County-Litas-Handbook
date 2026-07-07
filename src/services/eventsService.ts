import { eventRecords as staticEventRecords } from "../data/events";
import { featureFlags } from "../data/featureFlags";
import type { DashboardEvent, EventRecord, RideWeather, UpcomingEvent, CountdownStatus } from "../types";
import { getCountdownDisplay, getCountdownLabel as getCountdownLabelValue, getSidebarCountdown } from "../utils/countdown";
import { isWithinCurrentWeek, parseDate, toDateValue } from "../utils/date";
import { fetchCalendarEvents, loadCalendarEvents, PUBLIC_GOOGLE_CALENDAR_ICS_URL } from "./calendarService";
import { getPersistenceClient, warnAndUseFallback, type PersistenceResult } from "./persistence";

interface SupabaseEventRow {
  id: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string | null;
  time: string | null;
  location: string | null;
  city: string | null;
  description: string | null;
  status: string | null;
  flyer_status: string | null;
  notes: string | null;
  external_uid: string | null;
  source: string | null;
}

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
  source: "static" | "ics" | "supabase" | "fallback";
}

export interface EventSaveInput {
  id?: string;
  title: string;
  type: string;
  startDate: string;
  endDate?: string;
  time?: string;
  location?: string;
  city?: string;
  description?: string;
  status?: string;
  flyerStatus?: string;
  notes?: string;
  externalUid?: string;
}

export interface EventDashboardData {
  eventRecords: EventRecord[];
  nextEvent: DashboardEvent | null;
  upcomingEvents: UpcomingEvent[];
  sidebarCountdown: CountdownStatus;
  rideWeather: RideWeather | null;
}

export interface CalendarImportResult {
  source: "supabase" | "fallback";
  imported: EventRecord[];
  skipped: number;
  total: number;
  error?: string;
}

export function getEvents(): EventRecord[] {
  return staticEventRecords;
}

export async function saveEventRecord(input: EventSaveInput): Promise<PersistenceResult<EventRecord>> {
  const supabase = getPersistenceClient();

  if (!supabase) {
    return {
      data: toLocalEventRecord(input),
      source: "fallback"
    };
  }

  const payload = toSupabaseEventPayload(input);
  const query = input.id && isUuid(input.id)
    ? supabase.from("events").update(payload).eq("id", input.id).select().single()
    : supabase.from("events").insert(payload).select().single();

  const { data, error } = await query;

  if (error || !data) {
    warnAndUseFallback("Unable to save event to Supabase. Using local UI state instead.", error);
    return {
      data: toLocalEventRecord(input),
      source: "fallback"
    };
  }

  return {
    data: fromSupabaseEvent(data as SupabaseEventRow),
    source: "supabase"
  };
}

export async function deleteEventRecord(event: EventRecord): Promise<PersistenceResult<EventRecord>> {
  const supabase = getPersistenceClient();

  if (!supabase || !isUuid(event.id)) {
    return {
      data: event,
      source: "fallback"
    };
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", event.id);

  if (error) {
    warnAndUseFallback("Unable to delete event from Supabase. Keeping local UI state stable.", error);
    return {
      data: event,
      source: "fallback"
    };
  }

  return {
    data: event,
    source: "supabase"
  };
}

export async function importCalendarEventsFromIcs(
  calendarUrl = PUBLIC_GOOGLE_CALENDAR_ICS_URL
): Promise<CalendarImportResult> {
  const supabase = getPersistenceClient();

  if (!supabase) {
    return {
      source: "fallback",
      imported: [],
      skipped: 0,
      total: 0,
      error: "Supabase is not configured, so calendar events could not be imported."
    };
  }

  const calendarResult = await fetchCalendarEvents(calendarUrl);

  if (calendarResult.error) {
    return {
      source: "supabase",
      imported: [],
      skipped: 0,
      total: 0,
      error: calendarResult.error
    };
  }

  const events = calendarResult.events.filter((event) => Boolean(event.externalUid));
  const externalUids = events.map((event) => event.externalUid!);

  if (events.length === 0) {
    return {
      source: "supabase",
      imported: [],
      skipped: 0,
      total: calendarResult.events.length,
      error: "The calendar feed did not contain importable events."
    };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("events")
    .select("external_uid")
    .in("external_uid", externalUids);

  if (existingError) {
    warnAndUseFallback("Unable to compare calendar events against Supabase external IDs.", existingError);
    return {
      source: "supabase",
      imported: [],
      skipped: 0,
      total: events.length,
      error: "Calendar import needs the events.external_uid column in Supabase before it can avoid duplicates."
    };
  }

  const existingUids = new Set(
    (existingRows as Pick<SupabaseEventRow, "external_uid">[])
      .map((row) => row.external_uid)
      .filter((uid): uid is string => Boolean(uid))
  );
  const eventsToInsert = events.filter((event) => !existingUids.has(event.externalUid!));

  if (eventsToInsert.length === 0) {
    return {
      source: "supabase",
      imported: [],
      skipped: events.length,
      total: events.length
    };
  }

  const { data, error } = await supabase
    .from("events")
    .insert(eventsToInsert.map(toSupabaseImportedEventPayload))
    .select();

  if (error || !data) {
    warnAndUseFallback("Unable to import calendar events into Supabase.", error);
    return {
      source: "supabase",
      imported: [],
      skipped: events.length - eventsToInsert.length,
      total: events.length,
      error: "Calendar events could not be saved to Supabase. Existing events were kept."
    };
  }

  return {
    source: "supabase",
    imported: (data as SupabaseEventRow[]).map(fromSupabaseEvent),
    skipped: events.length - eventsToInsert.length,
    total: events.length
  };
}

export async function loadEventRecords(
  options: { enableIcs?: boolean } = {}
): Promise<EventLoadResult> {
  const supabaseEvents = await loadSupabaseEvents();

  if (supabaseEvents) {
    return {
      events: supabaseEvents,
      source: "supabase"
    };
  }

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

async function loadSupabaseEvents() {
  const supabase = getPersistenceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error || !data) {
    warnAndUseFallback("Unable to load events from Supabase. Falling back to static data.", error);
    return null;
  }

  return (data as SupabaseEventRow[]).map(fromSupabaseEvent);
}

function fromSupabaseEvent(row: SupabaseEventRow): EventRecord {
  const status = row.status ?? "Planning";
  const flyerStatus = row.flyer_status ?? "Needed";

  return {
    id: row.id,
    title: row.title,
    date: row.start_date,
    startDate: row.start_date,
    endDate: row.end_date ?? row.start_date,
    time: row.time ?? "TBD",
    location: row.location ?? "TBD",
    city: row.city ?? "",
    description: row.description ?? "",
    source: "supabase",
    type: row.type,
    status,
    flyerStatus,
    notes: row.notes ?? row.description ?? "",
    externalUid: row.external_uid ?? undefined,
    checklist: buildChecklist(row.location ?? "", row.type, flyerStatus)
  };
}

function toSupabaseEventPayload(input: EventSaveInput) {
  return {
    title: input.title,
    type: input.type,
    start_date: input.startDate,
    end_date: input.endDate || input.startDate,
    time: input.time ?? "",
    location: input.location ?? "",
    city: input.city ?? "",
    description: input.description ?? input.notes ?? "",
    status: input.status ?? "Planning",
    flyer_status: input.flyerStatus ?? "Needed",
    notes: input.notes ?? "",
    ...(input.externalUid ? { external_uid: input.externalUid } : {}),
    source: "supabase"
  };
}

function toSupabaseImportedEventPayload(event: EventRecord) {
  return {
    title: event.title,
    type: event.type,
    start_date: event.startDate,
    end_date: event.endDate || event.startDate,
    time: event.time,
    location: event.location,
    city: event.city,
    description: event.description,
    status: event.status,
    flyer_status: event.flyerStatus,
    notes: event.notes,
    external_uid: event.externalUid ?? event.id,
    source: "ics"
  };
}

function toLocalEventRecord(input: EventSaveInput): EventRecord {
  const startDate = input.startDate || toDateValue(new Date());
  const flyerStatus = input.flyerStatus ?? "Needed";

  return {
    id: input.id ?? createLocalId("event"),
    title: input.title,
    date: startDate,
    startDate,
    endDate: input.endDate || startDate,
    time: input.time ?? "TBD",
    location: input.location ?? "TBD",
    city: input.city ?? "",
    description: input.description ?? input.notes ?? "",
    source: "fallback",
    type: input.type,
    status: input.status ?? "Planning",
    flyerStatus,
    notes: input.notes ?? input.description ?? "",
    externalUid: input.externalUid,
    checklist: buildChecklist(input.location, input.type, flyerStatus)
  };
}

function buildChecklist(location = "", type = "", flyerStatus = "Needed") {
  const hasVenue = location.trim() !== "" && !location.toLowerCase().includes("tbd");
  const isRide = type.toLowerCase().includes("ride");
  const flyerPosted = flyerStatus === "Posted";

  return [
    { label: hasVenue ? "Venue Confirmed" : "Venue Needed", tone: hasVenue ? "success" : "warning" },
    { label: isRide ? "Route Needed" : "Route Optional", tone: isRide ? "warning" : "neutral" },
    { label: flyerPosted ? "Flyer Posted" : "Flyer Needed", tone: flyerPosted ? "success" : "warning" },
    { label: "Email Needed", tone: "warning" }
  ] as EventRecord["checklist"];
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}
