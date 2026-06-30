import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { DateBadge } from "../components/ui/DateBadge";
import { FormField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { DateInput, SelectInput, Textarea, TextInput, TimeInput } from "../components/ui/inputs";
import type { EventRecord } from "../types";

interface EventsProps {
  eventRecords: EventRecord[];
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function parseEventDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function Events({ eventRecords }: EventsProps) {
  const currentEvent = eventRecords[0];

  return (
    <PageContainer>
      <div className="page-title">
        <span>Events</span>
        <h1>Manage chapter events</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Event List" />
          <div className="record-list">
            {eventRecords.map((event) => (
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
                <StatusChip label={event.status} tone={event.status === "Ready" ? "success" : "warning"} />
              </article>
            ))}
          </div>
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
