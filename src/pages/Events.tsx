import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { DateBadge } from "../components/ui/DateBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { DateInput, SelectInput, Textarea, TextInput, TimeInput } from "../components/ui/inputs";
import type { EventRecord } from "../types";
import { getPastEvents, getUpcomingEvents } from "../services/eventsService";

interface EventsProps {
  eventRecords: EventRecord[];
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function parseEventDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getStatusTone(status: string) {
  if (status === "Ready" || status === "Scheduled") return "success";
  if (status === "Planning") return "warning";
  return "neutral";
}

function sortAscendingByStartDate(events: EventRecord[]) {
  return [...events].sort((a, b) => parseEventDate(a.startDate).getTime() - parseEventDate(b.startDate).getTime());
}

function sortDescendingByStartDate(events: EventRecord[]) {
  return [...events].sort((a, b) => parseEventDate(b.startDate).getTime() - parseEventDate(a.startDate).getTime());
}

function EventRows({ events }: { events: EventRecord[] }) {
  return (
    <div className="record-list">
      {events.map((event) => (
        <article className="record-row" key={event.id}>
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
        </article>
      ))}
    </div>
  );
}

export function Events({ eventRecords }: EventsProps) {
  const today = new Date();
  const upcomingEvents = sortAscendingByStartDate(getUpcomingEvents(eventRecords, today));
  const pastEvents = sortDescendingByStartDate(getPastEvents(eventRecords, today));
  const currentEvent = upcomingEvents[0] ?? pastEvents[0];

  return (
    <PageContainer>
      <div className="page-title">
        <span>Events</span>
        <h1>Manage branch events</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Upcoming Events" />
          {upcomingEvents.length > 0 ? (
            <EventRows events={upcomingEvents} />
          ) : (
            <EmptyState title="No upcoming events" message="Future events will appear here when they are added to the shared event source." />
          )}
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Event Detail" />
          <div className="detail-card">
            <h2>{currentEvent?.title ?? "No events loaded"}</h2>
            <p>{currentEvent ? `${currentEvent.startDate} at ${currentEvent.time}` : "Add a calendar file or use fallback events."}</p>
            <p>{currentEvent?.location ?? "No location"}</p>
            <div className="status-row">
              <StatusChip label={currentEvent?.type ?? "Calendar"} tone="accent" />
              <StatusChip label={`Source: ${currentEvent?.source ?? "none"}`} tone="neutral" />
            </div>
            <p>{currentEvent?.notes ?? ""}</p>
          </div>
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Past / History" />
          {pastEvents.length > 0 ? (
            <EventRows events={pastEvents} />
          ) : (
            <EmptyState title="No archived events yet" message="Past events will appear here automatically after their event dates pass." />
          )}
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Create / Edit Event" />
          <form className="form-grid" aria-label="Create or edit event">
            <FormField label="Event Name" htmlFor="event-name">
              <TextInput id="event-name" placeholder="Event name" />
            </FormField>
            <FormField label="Date" htmlFor="event-date">
              <DateInput id="event-date" />
            </FormField>
            <FormField label="Time" htmlFor="event-time">
              <TimeInput id="event-time" />
            </FormField>
            <FormField label="Location" htmlFor="event-location">
              <TextInput id="event-location" placeholder="Venue or meetup point" />
            </FormField>
            <FormField label="Event Type" htmlFor="event-type">
              <SelectInput id="event-type" defaultValue="Meet & Greet">
                <option>Meet & Greet</option>
                <option>Ride</option>
                <option>Community</option>
                <option>Special Event</option>
              </SelectInput>
            </FormField>
            <FormField label="Flyer Status" htmlFor="flyer-status">
              <SelectInput id="flyer-status" defaultValue="Needed">
                <option>Needed</option>
                <option>Drafting</option>
                <option>Posted</option>
              </SelectInput>
            </FormField>
            <FormField label="Notes" htmlFor="event-notes">
              <Textarea id="event-notes" placeholder="Planning notes, route, attendance, flyer links, or follow-ups." />
            </FormField>
            <div className="form-actions">
              <Button type="button" variant="primary" disabled title="Event editing is not connected yet.">
                Save event
              </Button>
              <Button type="reset" variant="ghost">Clear</Button>
              <span className="form-note">Editing is a visual workflow only until persistence is connected.</span>
            </div>
          </form>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}
