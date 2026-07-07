import { useMemo, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { DashboardCard } from "../components/ui/DashboardCard";
import { DateBadge } from "../components/ui/DateBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import type { EventRecord, RideRecord } from "../types";
import { getUpcomingRides } from "../services/ridesService";

interface RidePlannerProps {
  eventRecords: EventRecord[];
  rideRecords: RideRecord[];
  rideRecordsSource: "static" | "supabase" | "fallback";
  isLoading: boolean;
  isPersistenceConfigured: boolean;
}

interface RidePlan {
  id: string;
  title: string;
  date: string;
  status: string;
  rideLeader: string;
  sweep: string;
  difficulty: string;
  distance: string;
  duration: string;
  meetup: string;
  kickstandsUp: string;
  gasStopOne: string;
  gasStopTwo: string;
  regroupLocations: string;
  destination: string;
  returnPlan: string;
  beginnerFriendly: string;
  noFreeways: string;
  fuelInterval: string;
  weatherReminder: string;
  notes: string;
}

export function RidePlanner({ eventRecords, rideRecords, rideRecordsSource, isLoading, isPersistenceConfigured }: RidePlannerProps) {
  const ridePlans = useMemo(() => buildRidePlans(eventRecords, rideRecords), [eventRecords, rideRecords]);
  const [selectedRideId, setSelectedRideId] = useState<string | undefined>();
  const selectedRide = ridePlans.find((ride) => ride.id === selectedRideId) ?? ridePlans[0];

  return (
    <PageContainer>
      <div className="page-title">
        <span>Ride Planner</span>
        <h1>Build the ride plan</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Ride Queue" />
          {isLoading ? (
            <EmptyState title="Loading rides" message="Checking the configured ride source." />
          ) : ridePlans.length > 0 ? (
            <div className="record-list">
              {ridePlans.map((ride) => (
                <button
                  className={ride.id === selectedRide?.id ? "event-record-row record-row--selected" : "event-record-row"}
                  type="button"
                  key={ride.id}
                  onClick={() => setSelectedRideId(ride.id)}
                >
                  <DateBadge
                    month={getRideMonth(ride.date)}
                    day={getRideDay(ride.date)}
                    dateTime={ride.date}
                    compact
                  />
                  <span className="event-record-row__details">
                    <strong>{ride.title}</strong>
                    <em>{ride.date || "Date TBD"} · {ride.meetup}</em>
                  </span>
                  <span className="event-record-row__status">
                    <StatusChip label={ride.status} tone={ride.status === "Planning" ? "warning" : "accent"} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No rides yet" message="Ride plans will appear here when ride events or saved routes are available." />
          )}
          <p className="form-note">
            {getSourceNote(rideRecordsSource, isPersistenceConfigured)}
          </p>
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Ride Overview" />
          {selectedRide ? (
            <PlanningList
              rows={[
                ["Ride leader", selectedRide.rideLeader],
                ["Sweep", selectedRide.sweep],
                ["Difficulty", selectedRide.difficulty],
                ["Status", selectedRide.status],
                ["Estimated distance", selectedRide.distance],
                ["Estimated ride time", selectedRide.duration]
              ]}
            />
          ) : (
            <EmptyState title="No ride selected" message="Select a ride to review the working plan." />
          )}
        </DashboardCard>
        {selectedRide ? (
          <>
            <DashboardCard>
              <SectionHeader title="Route Plan" />
              <PlanningList
                rows={[
                  ["Meetup location", selectedRide.meetup],
                  ["Kickstands up", selectedRide.kickstandsUp],
                  ["Gas stop #1", selectedRide.gasStopOne],
                  ["Gas stop #2", selectedRide.gasStopTwo],
                  ["Regroup locations", selectedRide.regroupLocations],
                  ["Destination", selectedRide.destination],
                  ["Return plan", selectedRide.returnPlan]
                ]}
              />
            </DashboardCard>
            <DashboardCard>
              <SectionHeader title="Safety" />
              <PlanningList
                rows={[
                  ["Beginner Friendly", selectedRide.beginnerFriendly],
                  ["No Freeways", selectedRide.noFreeways],
                  ["Fuel interval", selectedRide.fuelInterval],
                  ["Weather reminder", selectedRide.weatherReminder]
                ]}
              />
            </DashboardCard>
            <DashboardCard className="span-all">
              <SectionHeader title="Ride Notes" />
              <p className="planner-notes">{selectedRide.notes || "Add route notes, known hazards, parking details, and arrival reminders when the plan is ready."}</p>
            </DashboardCard>
          </>
        ) : null}
      </div>
    </PageContainer>
  );
}

function PlanningList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="planning-list">
      {rows.map(([label, value]) => (
        <div className="planning-row" key={label}>
          <dt>{label}</dt>
          <dd>{value || "TBD"}</dd>
        </div>
      ))}
    </dl>
  );
}

function buildRidePlans(events: EventRecord[], rides: RideRecord[]): RidePlan[] {
  const eventPlans = getUpcomingRides(events).map(fromRideEvent);
  const savedRidePlans = getUpcomingSavedRides(rides).map(fromSavedRide);
  return [...eventPlans, ...savedRidePlans];
}

function fromRideEvent(event: EventRecord): RidePlan {
  const difficulty = event.rideDifficulty ?? "TBD";

  return {
    id: event.id,
    title: event.title,
    date: event.startDate,
    status: event.status,
    rideLeader: "TBD",
    sweep: "TBD",
    difficulty,
    distance: "TBD",
    duration: "TBD",
    meetup: event.location || "TBD",
    kickstandsUp: event.time || "TBD",
    gasStopOne: "TBD",
    gasStopTwo: "TBD",
    regroupLocations: "TBD",
    destination: event.city || "TBD",
    returnPlan: "TBD",
    beginnerFriendly: difficulty === "Beginner" ? "Yes" : "Review before announcing",
    noFreeways: "Confirm route",
    fuelInterval: "Confirm before posting",
    weatherReminder: "Review during event week",
    notes: event.notes || event.description
  };
}

function fromSavedRide(ride: RideRecord): RidePlan {
  return {
    id: ride.id,
    title: ride.title,
    date: ride.date,
    status: "Planning",
    rideLeader: "TBD",
    sweep: "TBD",
    difficulty: ride.difficulty || "TBD",
    distance: ride.mileage || "TBD",
    duration: ride.duration || "TBD",
    meetup: ride.meetup || "TBD",
    kickstandsUp: ride.time || "TBD",
    gasStopOne: "TBD",
    gasStopTwo: "TBD",
    regroupLocations: "TBD",
    destination: ride.destination || "TBD",
    returnPlan: "TBD",
    beginnerFriendly: ride.difficulty.toLowerCase().includes("beginner") ? "Yes" : "Review before announcing",
    noFreeways: "Confirm route",
    fuelInterval: "Confirm before posting",
    weatherReminder: "Review during event week",
    notes: ride.notes
  };
}

function getSourceNote(source: RidePlannerProps["rideRecordsSource"], isPersistenceConfigured: boolean) {
  if (source === "supabase") return "Source: Supabase";
  if (isPersistenceConfigured) return "Source: fallback. Supabase ride read failed, so static records are shown.";
  return "Source: fallback. Using static ride records.";
}

function getRideMonth(date: string) {
  if (!date) return "TBD";

  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(`${date}T00:00:00`));
}

function getRideDay(date: string) {
  if (!date) return "-";

  return String(new Date(`${date}T00:00:00`).getDate());
}

function getUpcomingSavedRides(rides: RideRecord[]) {
  const today = new Date(new Date().toDateString());

  return [...rides]
    .filter((ride) => ride.date && new Date(`${ride.date}T00:00:00`) >= today)
    .sort((a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime());
}
