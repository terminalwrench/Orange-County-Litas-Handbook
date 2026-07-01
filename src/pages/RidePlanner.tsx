import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { DateInput, SelectInput, Textarea, TextInput, TimeInput } from "../components/ui/inputs";
import type { EventRecord } from "../types";
import { getRides, getUpcomingRides } from "../services/ridesService";

interface RidePlannerProps {
  eventRecords: EventRecord[];
}

export function RidePlanner({ eventRecords }: RidePlannerProps) {
  const rideRecords = getRides();
  const upcomingRideEvents = getUpcomingRides(eventRecords);
  const nextRide = upcomingRideEvents[0] ?? null;

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
            {upcomingRideEvents.length > 0
              ? upcomingRideEvents.map((ride) => (
                  <article className="record-row" key={ride.id}>
                    <span>
                      <strong>{ride.title}</strong>
                      <em>{ride.startDate} · {ride.location}</em>
                    </span>
                    <StatusChip label={ride.status} tone={ride.status === "Planning" ? "warning" : "success"} />
                  </article>
                ))
              : rideRecords.map((ride) => (
                  <article className="record-row" key={ride.id}>
                    <span>
                      <strong>{ride.title}</strong>
                      <em>{ride.date} · {ride.destination}</em>
                    </span>
                    <StatusChip label={ride.difficulty} tone="accent" />
                  </article>
                ))}
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
          ) : (
            <EmptyState title="No upcoming branch ride" message="Ride events will appear here when they are added to the shared event source." />
          )}
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Ride Details" />
          <form className="form-grid" aria-label="Ride planning form">
            <FormField label="Ride Name" htmlFor="ride-name">
              <TextInput id="ride-name" placeholder="Ride name" />
            </FormField>
            <FormField label="Date" htmlFor="ride-date">
              <DateInput id="ride-date" />
            </FormField>
            <FormField label="Meetup Time" htmlFor="ride-time">
              <TimeInput id="ride-time" />
            </FormField>
            <FormField label="Difficulty" htmlFor="ride-difficulty">
              <SelectInput id="ride-difficulty" defaultValue="Beginner Friendly">
                <option>Beginner Friendly</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </SelectInput>
            </FormField>
            <FormField label="Meetup Location" htmlFor="ride-meetup">
              <TextInput id="ride-meetup" placeholder="Start location" />
            </FormField>
            <FormField label="Destination" htmlFor="ride-destination">
              <TextInput id="ride-destination" placeholder="Destination" />
            </FormField>
            <FormField label="Mileage" htmlFor="ride-mileage">
              <TextInput id="ride-mileage" placeholder="Approx. mileage" />
            </FormField>
            <FormField label="Duration" htmlFor="ride-duration">
              <TextInput id="ride-duration" placeholder="Approx. duration" />
            </FormField>
            <FormField label="Ride Notes" htmlFor="ride-notes">
              <Textarea id="ride-notes" placeholder="Fuel, regroup, weather, parking, lead/sweep, or direct-arrival notes." />
            </FormField>
            <div className="form-actions">
              <Button type="button" variant="primary" disabled title="Ride editing is not connected yet.">
                Save ride
              </Button>
              <Button type="reset" variant="ghost">Clear</Button>
              <span className="form-note">Ride saving is disabled until persistence is connected.</span>
            </div>
          </form>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}
