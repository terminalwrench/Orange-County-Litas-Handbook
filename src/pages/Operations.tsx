import { PageContainer } from "../components/layout/PageContainer";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import type { EventRecord, MediaItem, OperationItem, OperationStatus, RideRecord } from "../types";
import { getPastEvents, getUpcomingEvents } from "../services/eventsService";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

interface OperationsProps {
  eventRecords: EventRecord[];
  rideRecords: RideRecord[];
  operationItems: OperationItem[];
  mediaItems: MediaItem[];
  isLoading: boolean;
  isPersistenceConfigured: boolean;
}

export function Operations({
  eventRecords,
  rideRecords,
  operationItems,
  mediaItems,
  isLoading,
  isPersistenceConfigured
}: OperationsProps) {
  const upcomingEvents = getUpcomingEvents(eventRecords);
  const completedEvents = getPastEvents(eventRecords);
  const currentYear = new Date().getFullYear();
  const completedThisYear = completedEvents.filter(
    (event) => new Date(`${event.startDate}T00:00:00`).getFullYear() === currentYear
  );
  const upcomingRides = rideRecords.filter((ride) => new Date(`${ride.date}T00:00:00`) >= new Date(new Date().toDateString()));
  const activeOperationItems = operationItems.filter((item) => item.status !== "complete");
  const metrics = [
    { label: "Upcoming events", value: upcomingEvents.length },
    { label: "Completed events this year", value: completedThisYear.length },
    { label: "Total media assets", value: mediaItems.length },
    { label: "Upcoming rides", value: upcomingRides.length },
    { label: "Open operation items", value: activeOperationItems.length }
  ];

  return (
    <PageContainer>
      <div className="page-title">
        <span>Operations</span>
        <h1>Branch operations overview</h1>
      </div>
      <div className="module-grid">
        <DashboardCard>
          <SectionHeader title="Operational Status" />
          {isLoading ? (
            <EmptyState title="Loading operation items" message="Checking the configured operations source." />
          ) : operationItems.length > 0 ? (
            <div className="operation-list">
              {operationItems.map((item) => (
                <article className="operation-row" key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <em>{getOperationMeta(item)}</em>
                  </span>
                  <StatusChip label={formatStatus(item.status)} tone={getOperationStatusTone(item.status)} />
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No operation items" message="Operational items will appear here when they are added to Supabase." />
          )}
          <p className="form-note">
            {isPersistenceConfigured ? "Read-only Supabase mode is configured." : "Fallback mode: using static operation items."}
          </p>
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

function getOperationMeta(item: OperationItem) {
  const parts = [
    formatCategory(item.category),
    item.dueDate ? dateFormatter.format(new Date(`${item.dueDate}T00:00:00`)) : "",
    item.owner ?? "",
    item.priority ? `${item.priority} priority` : ""
  ].filter(Boolean);

  return parts.join(" · ");
}

function formatCategory(category: string) {
  return category.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatus(status: OperationStatus) {
  return status.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOperationStatusTone(status: OperationStatus) {
  if (status === "complete" || status === "confirmed") return "success";
  if (status === "pending" || status === "blocked") return "warning";
  return "neutral";
}
