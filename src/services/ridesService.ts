import { rideRecords } from "../data/rides";
import type { EventRecord, RideRecord } from "../types";
import { getNextRideEvent, getUpcomingEvents, isRideEvent } from "./eventsService";
import { getPersistenceClient, warnAndUseFallback } from "./persistence";

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
