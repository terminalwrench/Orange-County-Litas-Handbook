import { PageContainer } from "../components/layout/PageContainer";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import type { EventRecord, RideRecord } from "../types";
import { getPastEvents, getUpcomingEvents } from "../services/eventsService";
import { getAssetLibraryItems } from "../services/mediaService";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

interface OperationsProps {
  eventRecords: EventRecord[];
  rideRecords: RideRecord[];
}

export function Operations({ eventRecords, rideRecords }: OperationsProps) {
  const upcomingEvents = getUpcomingEvents(eventRecords);
  const completedEvents = getPastEvents(eventRecords);
  const currentYear = new Date().getFullYear();
  const completedThisYear = completedEvents.filter(
    (event) => new Date(`${event.startDate}T00:00:00`).getFullYear() === currentYear
  );
  const upcomingRides = rideRecords.filter((ride) => new Date(`${ride.date}T00:00:00`) >= new Date(new Date().toDateString()));
  const mediaItems = getAssetLibraryItems();
  const metrics = [
    { label: "Upcoming events", value: upcomingEvents.length },
    { label: "Completed events this year", value: completedThisYear.length },
    { label: "Total media assets", value: mediaItems.length },
    { label: "Upcoming rides", value: upcomingRides.length }
  ];

  return (
    <PageContainer>
      <div className="page-title">
        <span>Operations</span>
        <h1>Branch operations overview</h1>
      </div>
      <div className="module-grid">
        <DashboardCard>
          <SectionHeader title="Venue Status" />
          {upcomingEvents.length > 0 ? (
            <div className="venue-status-list">
              {upcomingEvents.slice(0, 4).map((event) => (
                <article className="venue-status-row" key={event.id}>
                  <span>
                    <strong>{event.location}</strong>
                    <em>{event.title} · {dateFormatter.format(new Date(`${event.startDate}T00:00:00`))}</em>
                  </span>
                  <StatusChip
                    label={event.location.toLowerCase().includes("tbd") ? "Needs venue" : "Confirmed"}
                    tone={event.location.toLowerCase().includes("tbd") ? "warning" : "success"}
                  />
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No upcoming venue confirmations" message="Upcoming venue status appears here when events are scheduled." />
          )}
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Branch Metrics" />
          <div className="metrics-grid">
            {metrics.map((metric) => (
              <article className="metric-tile" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Recently Completed" />
          {completedEvents.length > 0 ? (
            <div className="record-list">
              {completedEvents.slice(0, 4).map((event) => (
                <article className="record-row" key={event.id}>
                  <span>
                    <strong>{event.title}</strong>
                    <em>{dateFormatter.format(new Date(`${event.startDate}T00:00:00`))} · {event.type}</em>
                  </span>
                  <StatusChip label="Completed" tone="success" />
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No completed events in the current source" message="Completed events appear here automatically when the shared event source includes past records." />
          )}
        </DashboardCard>
      </div>
    </PageContainer>
  );
}
