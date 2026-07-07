import { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import type { EventRecord, RideRecord } from "../types";
import { getUpcomingRides } from "../services/ridesService";

interface RidePlannerProps {
  eventRecords: EventRecord[];
  rideRecords: RideRecord[];
  isLoading: boolean;
  isPersistenceConfigured: boolean;
}

export function RidePlanner({ eventRecords, rideRecords, isLoading, isPersistenceConfigured }: RidePlannerProps) {
  const upcomingRideEvents = getUpcomingRides(eventRecords);
  const upcomingSavedRides = getUpcomingSavedRides(rideRecords);
  const nextRide = upcomingRideEvents[0] ?? null;
  const nextSavedRide = upcomingSavedRides[0] ?? null;
  const [selectedRideId, setSelectedRideId] = useState<string | undefined>();
  const selectedRide = rideRecords.find((ride) => ride.id === selectedRideId);

  return (
    <PageContainer>
      <div className="page-title">
        <span>Ride Planner</span>
        <h1>Plan rides without overbuilding it</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Ride List" />
          <div className="record-list">
            {isLoading ? (
              <EmptyState title="Loading rides" message="Checking the configured ride source." />
            ) : upcomingRideEvents.length > 0 || upcomingSavedRides.length > 0 ? (
              <>
                {upcomingRideEvents.map((ride) => (
                  <article className="record-row" key={ride.id}>
                    <span>
                      <strong>{ride.title}</strong>
                      <em>{ride.startDate} · {ride.location}</em>
                    </span>
                    <StatusChip label={ride.status} tone={ride.status === "Planning" ? "warning" : "success"} />
                  </article>
                ))}
                {upcomingSavedRides.map((ride) => (
                  <article className={ride.id === selectedRideId ? "record-row record-row--selected" : "record-row"} key={ride.id}>
                    <span>
                      <strong>{ride.title}</strong>
                      <em>{ride.date} · {ride.destination}</em>
                    </span>
                    <StatusChip label={ride.difficulty} tone="accent" />
                    <Button type="button" variant="ghost" onClick={() => setSelectedRideId(ride.id)}>
                      View
                    </Button>
                  </article>
                ))}
              </>
            ) : (
              <EmptyState title="No rides yet" message="Saved rides and ride events will appear here." />
            )}
          </div>
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Upcoming Ride" />
          {nextRide ? (
            <div className="detail-card">
              <h2>{nextRide.title}</h2>
              <p>Meetup: {nextRide.location}</p>
              <p>Date: {nextRide.startDate} at {nextRide.time}</p>
              <p>Status: {nextRide.status}</p>
              <p>{nextRide.notes}</p>
            </div>
          ) : nextSavedRide ? (
            <RideDetail ride={nextSavedRide} />
          ) : (
            <EmptyState title="No upcoming branch ride" message="Ride events will appear here when they are added to the shared event source." />
          )}
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Ride Details" />
          {selectedRide ?? nextSavedRide ? (
            <RideDetail ride={selectedRide ?? nextSavedRide!} />
          ) : (
            <EmptyState title="No saved ride selected" message="Saved ride details will appear here when rides are available." />
          )}
          <p className="form-note">
            {isPersistenceConfigured ? "Read-only Supabase mode is configured." : "Fallback mode: using static ride records."}
          </p>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

function RideDetail({ ride }: { ride: RideRecord }) {
  return (
    <div className="detail-card">
      <h2>{ride.title}</h2>
      <p>Meetup: {ride.meetup || "TBD"}</p>
      <p>Date: {ride.date || "TBD"}</p>
      <p>Destination: {ride.destination || "TBD"}</p>
      <p>Difficulty: {ride.difficulty}</p>
      <p>{ride.notes}</p>
    </div>
  );
}

function getUpcomingSavedRides(rides: RideRecord[]) {
  const today = new Date(new Date().toDateString());

  return [...rides]
    .filter((ride) => ride.date && new Date(`${ride.date}T00:00:00`) >= today)
    .sort((a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime());
}
