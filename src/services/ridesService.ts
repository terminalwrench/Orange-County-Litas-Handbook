import { rideRecords } from "../data/rides";
import type { EventRecord, RideRecord, RideStop } from "../types";
import { getNextRideEvent, getUpcomingEvents, isRideEvent } from "./eventsService";
import { getPersistenceClient, warnAndUseFallback, type PersistenceResult } from "./persistence";

interface SupabaseRideRow {
  id: string;
  event_id: string | null;
  title: string;
  date: string | null;
  status: string | null;
  meetup: string | null;
  destination: string | null;
  mileage: string | null;
  duration: string | null;
  difficulty: string | null;
  ride_leader: string | null;
  sweep: string | null;
  estimated_distance: string | null;
  estimated_ride_time: string | null;
  freeways: boolean | null;
  meetup_time: string | null;
  starting_location: string | null;
  kickstands_up: string | null;
  primary_route_link: string | null;
  alternative_route_link: string | null;
  total_distance: string | null;
  route_duration: string | null;
  ride_type: string | null;
  visibility: string | null;
  weather_policy: string | null;
  stops: RideStop[] | null;
  notes: string | null;
}

interface SupabaseRideSaveError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

export interface RideSaveInput {
  id?: string;
  eventId?: string;
  title: string;
  date: string;
  status: string;
  rideLeader?: string;
  sweep?: string;
  difficulty: string;
  estimatedDistance?: string;
  estimatedRideTime?: string;
  freeways: boolean;
  meetupTime?: string;
  startingLocation?: string;
  kickstandsUp?: string;
  primaryRouteLink?: string;
  alternativeRouteLink?: string;
  totalDistance?: string;
  routeDuration?: string;
  destination?: string;
  rideType?: string;
  visibility?: string;
  weatherPolicy?: string;
  stops: RideStop[];
  notes?: string;
}

export function getRides(): RideRecord[] {
  return rideRecords;
}

export async function saveRideRecord(input: RideSaveInput): Promise<PersistenceResult<RideRecord>> {
  const supabase = getPersistenceClient();

  if (!supabase) {
    return {
      data: toLocalRideRecord(input),
      source: "fallback"
    };
  }

  const payload = toSupabaseRidePayload(input);
  const query = input.id && isUuid(input.id)
    ? supabase.from("rides").update(payload).eq("id", input.id).select().single()
    : supabase.from("rides").insert(payload).select().single();

  const { data, error } = await query;

  if (error || !data) {
    logRideSaveError(input.id && isUuid(input.id) ? "update" : "insert", input.id, payload, error ?? new Error("Supabase ride save returned no data."));
    throw createRideSaveError(input.id && isUuid(input.id) ? "update" : "insert", input.id, payload, error ?? new Error("Supabase ride save returned no data."));
  }

  return {
    data: fromSupabaseRide(data as SupabaseRideRow),
    source: "supabase"
  };
}

export async function deleteRideRecord(ride: RideRecord): Promise<PersistenceResult<RideRecord>> {
  const supabase = getPersistenceClient();

  if (!supabase || !isUuid(ride.id)) {
    return {
      data: ride,
      source: "fallback"
    };
  }

  const { error } = await supabase
    .from("rides")
    .delete()
    .eq("id", ride.id);

  if (error) {
    warnAndUseFallback("Unable to delete ride from Supabase. Keeping local UI state stable.", error);
    return {
      data: ride,
      source: "fallback"
    };
  }

  return {
    data: ride,
    source: "supabase"
  };
}

export async function loadRideRecords() {
  const supabase = getPersistenceClient();
  if (!supabase) {
    return {
      rides: getRides(),
      source: "static" as const
    };
  }

  const { data, error } = await supabase
    .from("rides")
    .select("*")
    .order("date", { ascending: true });

  if (error || !data) {
    warnAndUseFallback("Unable to load rides from Supabase. Falling back to static data.", error);
    return {
      rides: getRides(),
      source: "fallback" as const
    };
  }

  return {
    rides: (data as SupabaseRideRow[]).map(fromSupabaseRide),
    source: "supabase" as const
  };
}

export function getUpcomingRides(events: EventRecord[], today = new Date()): EventRecord[] {
  return getUpcomingEvents(events, today).filter(isRideEvent);
}

export function getNextRide(events: EventRecord[], today = new Date()) {
  return getNextRideEvent(events, today);
}

function fromSupabaseRide(row: SupabaseRideRow): RideRecord {
  return {
    id: row.id,
    eventId: row.event_id ?? undefined,
    title: row.title,
    date: row.date ?? "",
    status: row.status ?? "Planning",
    meetup: row.meetup ?? "",
    destination: row.destination ?? "",
    mileage: row.mileage ?? "",
    duration: row.duration ?? "",
    difficulty: row.difficulty ?? "Beginner Friendly",
    rideLeader: row.ride_leader ?? undefined,
    sweep: row.sweep ?? undefined,
    estimatedDistance: row.estimated_distance ?? row.mileage ?? "",
    estimatedRideTime: row.estimated_ride_time ?? row.duration ?? "Flexible",
    freeways: row.freeways ?? false,
    meetupTime: toTimeInputValue(row.meetup_time ?? ""),
    startingLocation: row.starting_location ?? row.meetup ?? "",
    kickstandsUp: toTimeInputValue(row.meetup_time ?? row.kickstands_up ?? ""),
    primaryRouteLink: row.primary_route_link ?? undefined,
    alternativeRouteLink: row.alternative_route_link ?? undefined,
    totalDistance: row.total_distance ?? row.mileage ?? "",
    routeDuration: row.route_duration ?? row.duration ?? "",
    rideType: row.ride_type ?? "Group Ride",
    visibility: row.visibility ?? "Chapter Only",
    weatherPolicy: row.weather_policy ?? "Leader Decision",
    stops: Array.isArray(row.stops) ? row.stops : [],
    notes: row.notes ?? ""
  };
}

function toSupabaseRidePayload(input: RideSaveInput) {
  return {
    ...(input.eventId && isUuid(input.eventId) ? { event_id: input.eventId } : {}),
    title: input.title,
    date: input.date || null,
    status: input.status,
    meetup: input.startingLocation ?? "",
    destination: input.destination ?? "",
    mileage: input.estimatedDistance ?? "",
    duration: input.estimatedRideTime ?? "Flexible",
    difficulty: input.difficulty,
    ride_leader: input.rideLeader ?? "",
    sweep: input.sweep ?? "",
    estimated_distance: input.estimatedDistance ?? "",
    estimated_ride_time: input.estimatedRideTime ?? "Flexible",
    freeways: input.freeways,
    meetup_time: toDatabaseTime(input.meetupTime ?? input.kickstandsUp ?? ""),
    starting_location: input.startingLocation ?? "",
    kickstands_up: input.kickstandsUp ?? "",
    primary_route_link: input.primaryRouteLink ?? "",
    alternative_route_link: input.alternativeRouteLink ?? "",
    total_distance: input.totalDistance ?? "",
    route_duration: input.routeDuration ?? "",
    ride_type: input.rideType ?? "Group Ride",
    visibility: input.visibility ?? "Chapter Only",
    weather_policy: input.weatherPolicy ?? "Leader Decision",
    stops: input.stops,
    notes: input.notes ?? ""
  };
}

function logRideSaveError(action: string, rideId: string | undefined, payload: Record<string, unknown>, error: unknown) {
  console.error("[ride-planner] Supabase ride save failed.", {
    action,
    rideId,
    payloadKeys: Object.keys(payload),
    payload,
    supabaseError: getSupabaseErrorDetails(error),
    error
  });
}

function createRideSaveError(action: string, rideId: string | undefined, payload: Record<string, unknown>, error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const message = details.message || (error instanceof Error ? error.message : "Ride could not be saved to Supabase.");
  const nextError = new Error(message);

  Object.assign(nextError, {
    action,
    rideId,
    payloadKeys: Object.keys(payload),
    payload,
    supabaseError: details,
    cause: error
  });

  return nextError;
}

function getSupabaseErrorDetails(error: unknown): SupabaseRideSaveError {
  if (!error || typeof error !== "object") {
    return {
      message: error instanceof Error ? error.message : String(error ?? "Unknown Supabase error")
    };
  }

  const supabaseError = error as SupabaseRideSaveError;

  return {
    code: supabaseError.code,
    message: supabaseError.message,
    details: supabaseError.details,
    hint: supabaseError.hint
  };
}

function toLocalRideRecord(input: RideSaveInput): RideRecord {
  return {
    id: input.id ?? createLocalId("ride"),
    eventId: input.eventId,
    title: input.title,
    date: input.date,
    status: input.status,
    meetup: input.startingLocation ?? "",
    destination: input.destination ?? "",
    mileage: input.estimatedDistance ?? "",
    duration: input.estimatedRideTime ?? "Flexible",
    difficulty: input.difficulty,
    rideLeader: input.rideLeader,
    sweep: input.sweep,
    estimatedDistance: input.estimatedDistance,
    estimatedRideTime: input.estimatedRideTime,
    freeways: input.freeways,
    meetupTime: input.meetupTime ?? input.kickstandsUp,
    startingLocation: input.startingLocation,
    kickstandsUp: input.kickstandsUp,
    primaryRouteLink: input.primaryRouteLink,
    alternativeRouteLink: input.alternativeRouteLink,
    totalDistance: input.totalDistance,
    routeDuration: input.routeDuration,
    rideType: input.rideType,
    visibility: input.visibility,
    weatherPolicy: input.weatherPolicy,
    stops: input.stops,
    notes: input.notes ?? ""
  };
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

function toTimeInputValue(value: string) {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : "";
}

function toDatabaseTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value) ? value : null;
}
