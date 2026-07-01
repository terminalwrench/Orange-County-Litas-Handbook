import { rideRecords } from "../data/rides";
import type { EventRecord, RideRecord } from "../types";
import { getNextRideEvent, getUpcomingEvents, isRideEvent } from "./eventsService";

export function getRides(): RideRecord[] {
  return rideRecords;
}

export function getUpcomingRides(events: EventRecord[], today = new Date()): EventRecord[] {
  return getUpcomingEvents(events, today).filter(isRideEvent);
}

export function getNextRide(events: EventRecord[], today = new Date()) {
  return getNextRideEvent(events, today);
}
