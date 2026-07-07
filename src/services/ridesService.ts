import { rideRecords } from "../data/rides";
import type { EventRecord, RideRecord } from "../types";
import { getNextRideEvent, getUpcomingEvents, isRideEvent } from "./eventsService";
import { getPersistenceClient, warnAndUseFallback, type PersistenceResult } from "./persistence";

interface SupabaseRideRow {
  id: string;
  event_id: string | null;
  title: string;
  date: string | null;
  meetup: string | null;
  destination: string | null;
  mileage: string | null;
  duration: string | null;
  difficulty: string | null;
  notes: string | null;
}

export interface RideSaveInput {
  id?: string;
  eventId?: string;
  title: string;
  date?: string;
  time?: string;
  meetup?: string;
  destination?: string;
  mileage?: string;
  duration?: string;
  difficulty?: string;
  notes?: string;
}

export function getRides(): RideRecord[] {
  return rideRecords;
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
    warnAndUseFallback("Unable to save ride to Supabase. Using local UI state instead.", error);
    return {
      data: toLocalRideRecord(input),
      source: "fallback"
    };
  }

  return {
    data: fromSupabaseRide(data as SupabaseRideRow),
    source: "supabase"
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
    meetup: row.meetup ?? "",
    destination: row.destination ?? "",
    mileage: row.mileage ?? "",
    duration: row.duration ?? "",
    difficulty: row.difficulty ?? "Beginner Friendly",
    notes: row.notes ?? ""
  };
}

function toSupabaseRidePayload(input: RideSaveInput) {
  return {
    event_id: input.eventId && isUuid(input.eventId) ? input.eventId : null,
    title: input.title,
    date: input.date || null,
    meetup: input.meetup ?? "",
    destination: input.destination ?? "",
    mileage: input.mileage ?? "",
    duration: input.duration ?? "",
    difficulty: input.difficulty ?? "Beginner Friendly",
    notes: input.notes ?? ""
  };
}

function toLocalRideRecord(input: RideSaveInput): RideRecord {
  return {
    id: input.id ?? createLocalId("ride"),
    eventId: input.eventId,
    title: input.title,
    date: input.date ?? "",
    time: input.time,
    meetup: input.meetup ?? "",
    destination: input.destination ?? "",
    mileage: input.mileage ?? "",
    duration: input.duration ?? "",
    difficulty: input.difficulty ?? "Beginner Friendly",
    notes: input.notes ?? ""
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}
