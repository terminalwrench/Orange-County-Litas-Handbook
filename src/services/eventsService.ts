import { eventRecords as staticEventRecords } from "../data/events";
import { featureFlags } from "../data/featureFlags";
import type { DashboardEvent, EventReadinessKey, EventRecord, RideWeather, UpcomingEvent, CountdownStatus } from "../types";
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
  ride_difficulty: string | null;
  venue_confirmed: boolean | null;
  route_complete: boolean | null;
  flyer_posted: boolean | null;
  email_sent: boolean | null;
  flyer_url: string | null;
  group_photo_url: string | null;
  route_image_url: string | null;
  instagram_url: string | null;
  apple_album_url: string | null;
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
  rideDifficulty?: string;
  venueConfirmed?: boolean;
  routeComplete?: boolean;
  flyerPosted?: boolean;
  emailSent?: boolean;
  flyerUrl?: string;
  groupPhotoUrl?: string;
  routeImageUrl?: string;
  instagramUrl?: string;
  appleAlbumUrl?: string;
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
    category: event.type,
    isReady: isEventReady(event)
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
  const status = normalizeEventStatus(row.status ?? undefined);
  const flyerStatus = row.flyer_posted ? "Posted" : row.flyer_status ?? "Needed";
  const readiness = getReadinessState({
    location: row.location ?? "",
    type: row.type,
    flyerStatus,
    venueConfirmed: row.venue_confirmed ?? undefined,
    routeComplete: row.route_complete ?? undefined,
    flyerPosted: row.flyer_posted ?? undefined,
    emailSent: row.email_sent ?? undefined
  });

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
    rideDifficulty: row.ride_difficulty ?? undefined,
    ...readiness,
    flyerUrl: row.flyer_url ?? undefined,
    groupPhotoUrl: row.group_photo_url ?? undefined,
    routeImageUrl: row.route_image_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    appleAlbumUrl: row.apple_album_url ?? undefined,
    notes: row.notes ?? row.description ?? "",
    externalUid: row.external_uid ?? undefined,
    checklist: buildChecklist(readiness)
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
    status: normalizeEventStatus(input.status),
    flyer_status: typeof input.flyerPosted === "boolean" ? (input.flyerPosted ? "Posted" : "Needed") : input.flyerStatus ?? "Needed",
    ...(input.rideDifficulty ? { ride_difficulty: input.rideDifficulty } : {}),
    ...(typeof input.venueConfirmed === "boolean" ? { venue_confirmed: input.venueConfirmed } : {}),
    ...(typeof input.routeComplete === "boolean" ? { route_complete: input.routeComplete } : {}),
    ...(typeof input.flyerPosted === "boolean" ? { flyer_posted: input.flyerPosted } : {}),
    ...(typeof input.emailSent === "boolean" ? { email_sent: input.emailSent } : {}),
    ...(input.flyerUrl ? { flyer_url: input.flyerUrl } : {}),
    ...(input.groupPhotoUrl ? { group_photo_url: input.groupPhotoUrl } : {}),
    ...(input.routeImageUrl ? { route_image_url: input.routeImageUrl } : {}),
    ...(input.instagramUrl ? { instagram_url: input.instagramUrl } : {}),
    ...(input.appleAlbumUrl ? { apple_album_url: input.appleAlbumUrl } : {}),
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
    status: normalizeEventStatus(event.status),
    flyer_status: typeof event.flyerPosted === "boolean" ? (event.flyerPosted ? "Posted" : "Needed") : event.flyerStatus,
    ...(event.rideDifficulty ? { ride_difficulty: event.rideDifficulty } : {}),
    ...(typeof event.venueConfirmed === "boolean" ? { venue_confirmed: event.venueConfirmed } : {}),
    ...(typeof event.routeComplete === "boolean" ? { route_complete: event.routeComplete } : {}),
    ...(typeof event.flyerPosted === "boolean" ? { flyer_posted: event.flyerPosted } : {}),
    ...(typeof event.emailSent === "boolean" ? { email_sent: event.emailSent } : {}),
    ...(event.flyerUrl ? { flyer_url: event.flyerUrl } : {}),
    ...(event.groupPhotoUrl ? { group_photo_url: event.groupPhotoUrl } : {}),
    ...(event.routeImageUrl ? { route_image_url: event.routeImageUrl } : {}),
    ...(event.instagramUrl ? { instagram_url: event.instagramUrl } : {}),
    ...(event.appleAlbumUrl ? { apple_album_url: event.appleAlbumUrl } : {}),
    notes: event.notes,
    external_uid: event.externalUid ?? event.id,
    source: "ics"
  };
}

function toLocalEventRecord(input: EventSaveInput): EventRecord {
  const startDate = input.startDate || toDateValue(new Date());
  const flyerStatus = input.flyerStatus ?? "Needed";
  const readiness = getReadinessState({
    location: input.location ?? "",
    type: input.type,
    flyerStatus,
    venueConfirmed: input.venueConfirmed,
    routeComplete: input.routeComplete,
    flyerPosted: input.flyerPosted,
    emailSent: input.emailSent
  });

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
    status: normalizeEventStatus(input.status),
    flyerStatus,
    rideDifficulty: input.rideDifficulty,
    ...readiness,
    flyerUrl: input.flyerUrl,
    groupPhotoUrl: input.groupPhotoUrl,
    routeImageUrl: input.routeImageUrl,
    instagramUrl: input.instagramUrl,
    appleAlbumUrl: input.appleAlbumUrl,
    notes: input.notes ?? input.description ?? "",
    externalUid: input.externalUid,
    checklist: buildChecklist(readiness)
  };
}

function buildChecklist(readiness: Record<EventReadinessKey, boolean>) {
  return [
    toReadinessItem("venueConfirmed", "Venue Confirmed", readiness.venueConfirmed),
    toReadinessItem("routeComplete", "Route Complete", readiness.routeComplete),
    toReadinessItem("flyerPosted", "Flyer Posted", readiness.flyerPosted),
    toReadinessItem("emailSent", "Email Sent", readiness.emailSent)
  ] as EventRecord["checklist"];
}

function toReadinessItem(key: EventReadinessKey, label: string, complete: boolean) {
  return {
    key,
    label,
    complete,
    tone: complete ? "success" : "warning"
  } as EventRecord["checklist"][number];
}

function getReadinessState({
  location = "",
  type = "",
  flyerStatus = "Needed",
  venueConfirmed,
  routeComplete,
  flyerPosted,
  emailSent
}: {
  location?: string;
  type?: string;
  flyerStatus?: string;
  venueConfirmed?: boolean;
  routeComplete?: boolean;
  flyerPosted?: boolean;
  emailSent?: boolean;
}): Record<EventReadinessKey, boolean> {
  const hasVenue = location.trim() !== "" && !location.toLowerCase().includes("tbd");
  const isRide = type.toLowerCase().includes("ride");

  return {
    venueConfirmed: venueConfirmed ?? hasVenue,
    routeComplete: routeComplete ?? !isRide,
    flyerPosted: flyerPosted ?? flyerStatus === "Posted",
    emailSent: emailSent ?? false
  };
}

function isEventReady(event: EventRecord) {
  return event.checklist.every((item) => item.complete);
}

function normalizeEventStatus(status = "Planning") {
  if (status === "Active") return "Ready";
  if (status === "Ready" || status === "Completed" || status === "Cancelled" || status === "Planning") return status;
  return "Planning";
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
