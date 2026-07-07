import { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { DateBadge } from "../components/ui/DateBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import type { EventRecord } from "../types";
import { getPastEvents, getUpcomingEvents } from "../services/eventsService";

interface EventsProps {
  eventRecords: EventRecord[];
  eventRecordsSource: "static" | "supabase" | "fallback" | "ics";
  isLoading: boolean;
  isPersistenceConfigured: boolean;
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function parseEventDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getStatusTone(status: string) {
  if (status === "Ready" || status === "Scheduled" || status === "Completed") return "success";
  if (status === "Planning") return "warning";
  return "neutral";
}

function sortAscendingByStartDate(events: EventRecord[]) {
  return [...events].sort((a, b) => parseEventDate(a.startDate).getTime() - parseEventDate(b.startDate).getTime());
}

function sortDescendingByStartDate(events: EventRecord[]) {
  return [...events].sort((a, b) => parseEventDate(b.startDate).getTime() - parseEventDate(a.startDate).getTime());
}

function EventRows({ events, selectedId, onSelect }: { events: EventRecord[]; selectedId?: string; onSelect: (event: EventRecord) => void }) {
  return (
    <div className="record-list">
      {events.map((event) => (
        <article className={event.id === selectedId ? "record-row record-row--selected" : "record-row"} key={event.id}>
          <DateBadge
            month={monthFormatter.format(parseEventDate(event.startDate))}
            day={String(parseEventDate(event.startDate).getDate())}
            dateTime={event.startDate}
            compact
          />
          <span>
            <strong>{event.title}</strong>
            <em>{event.time} · {event.location}</em>
          </span>
          <StatusChip label={event.status} tone={getStatusTone(event.status)} />
          <Button type="button" variant="ghost" onClick={() => onSelect(event)}>
            View
          </Button>
        </article>
      ))}
    </div>
  );
}

export function Events({ eventRecords, eventRecordsSource, isLoading, isPersistenceConfigured }: EventsProps) {
  const today = new Date();
  const upcomingEvents = sortAscendingByStartDate(getUpcomingEvents(eventRecords, today));
  const pastEvents = sortDescendingByStartDate(getPastEvents(eventRecords, today));
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const selectedEvent = eventRecords.find((event) => event.id === selectedEventId);
  const currentEvent = selectedEvent ?? upcomingEvents[0] ?? pastEvents[0];

  return (
    <PageContainer>
      <div className="page-title">
        <span>Events</span>
        <h1>Manage branch events</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Upcoming Events" />
          {isLoading ? (
            <EmptyState title="Loading events" message="Checking the configured event source." />
          ) : upcomingEvents.length > 0 ? (
            <EventRows events={upcomingEvents} selectedId={selectedEventId} onSelect={(event) => setSelectedEventId(event.id)} />
          ) : (
            <EmptyState title="No events yet" message="Events will appear here when they are added to Supabase." />
          )}
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Event Detail" />
          <div className="detail-card">
            <h2>{currentEvent?.title ?? "No events yet"}</h2>
            <p>{currentEvent ? `${currentEvent.startDate} at ${currentEvent.time}` : getEmptySourceMessage(eventRecordsSource, isPersistenceConfigured)}</p>
            <p>{currentEvent?.location ?? ""}</p>
            <div className="status-row">
              <StatusChip label={currentEvent?.type ?? "Calendar"} tone="accent" />
              <StatusChip label={`Source: ${formatSourceLabel(eventRecordsSource)}`} tone="neutral" />
            </div>
            <p>{currentEvent?.notes ?? ""}</p>
            <p className="form-note">
              {getSourceNote(eventRecordsSource, isPersistenceConfigured)}
            </p>
          </div>
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Past / History" />
          {pastEvents.length > 0 ? (
            <EventRows events={pastEvents} selectedId={selectedEventId} onSelect={(event) => setSelectedEventId(event.id)} />
          ) : (
            <EmptyState title="No archived events yet" message="Past events will appear here automatically after their event dates pass." />
          )}
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

function formatSourceLabel(source: EventsProps["eventRecordsSource"]) {
  if (source === "supabase") return "Supabase";
  if (source === "ics") return "ICS";
  return "fallback";
}

function getSourceNote(source: EventsProps["eventRecordsSource"], isPersistenceConfigured: boolean) {
  if (source === "supabase") return "Live Supabase event records are loaded.";
  if (source === "ics") return "Calendar export records are loaded.";
  if (isPersistenceConfigured) return "Fallback mode: Supabase event read failed, so static records are shown.";
  return "Fallback mode: using static event records.";
}

function getEmptySourceMessage(source: EventsProps["eventRecordsSource"], isPersistenceConfigured: boolean) {
  if (source === "supabase") return "The live Supabase events table is empty.";
  if (source === "ics") return "The calendar source has no events.";
  if (isPersistenceConfigured) return "Supabase could not be read, so fallback records may be shown when available.";
  return "Connect Supabase or use fallback events.";
}
