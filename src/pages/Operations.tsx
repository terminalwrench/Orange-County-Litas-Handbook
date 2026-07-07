import { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { SelectInput } from "../components/ui/inputs";
import type { EventRecord, OperationItem, OperationStatus, RideRecord } from "../types";
import { getPastEvents, getUpcomingEvents } from "../services/eventsService";
import { getAssetLibraryItems } from "../services/mediaService";
import type { PersistenceResult } from "../services/persistence";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

interface OperationsProps {
  eventRecords: EventRecord[];
  rideRecords: RideRecord[];
  operationItems: OperationItem[];
  isLoading: boolean;
  isPersistenceConfigured: boolean;
  onUpdateOperationStatus: (
    item: OperationItem,
    status: OperationStatus
  ) => Promise<PersistenceResult<OperationItem>>;
}

const operationStatuses: OperationStatus[] = ["pending", "planned", "confirmed", "complete", "blocked"];

export function Operations({
  eventRecords,
  rideRecords,
  operationItems,
  isLoading,
  isPersistenceConfigured,
  onUpdateOperationStatus
}: OperationsProps) {
  const upcomingEvents = getUpcomingEvents(eventRecords);
  const completedEvents = getPastEvents(eventRecords);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const currentYear = new Date().getFullYear();
  const completedThisYear = completedEvents.filter(
    (event) => new Date(`${event.startDate}T00:00:00`).getFullYear() === currentYear
  );
  const upcomingRides = rideRecords.filter((ride) => new Date(`${ride.date}T00:00:00`) >= new Date(new Date().toDateString()));
  const mediaItems = getAssetLibraryItems();
  const activeOperationItems = operationItems.filter((item) => item.status !== "complete");
  const metrics = [
    { label: "Upcoming events", value: upcomingEvents.length },
    { label: "Completed events this year", value: completedThisYear.length },
    { label: "Total media assets", value: mediaItems.length },
    { label: "Upcoming rides", value: upcomingRides.length },
    { label: "Open operation items", value: activeOperationItems.length }
  ];

  async function handleStatusChange(item: OperationItem, status: OperationStatus) {
    setSavingItemId(item.id);
    setSaveError("");

    try {
      await onUpdateOperationStatus(item, status);
    } catch (error) {
      console.warn("[operations] Unable to update operation item status.", error);
      setSaveError("Status could not be saved. The page is still stable; try again in a moment.");
    } finally {
      setSavingItemId(null);
    }
  }

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
                  <SelectInput
                    aria-label={`Status for ${item.title}`}
                    value={item.status}
                    disabled={savingItemId === item.id}
                    onChange={(event) => handleStatusChange(item, event.target.value as OperationStatus)}
                  >
                    {operationStatuses.map((status) => (
                      <option key={status} value={status}>{formatStatus(status)}</option>
                    ))}
                  </SelectInput>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No operation items" message="Operational items will appear here when they are added to Supabase." />
          )}
          <p className="form-note">
            {isPersistenceConfigured ? "Status changes save to Supabase." : "Fallback mode: status changes stay local to this session."}
          </p>
          {saveError ? <p className="form-status form-status--error">{saveError}</p> : null}
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
