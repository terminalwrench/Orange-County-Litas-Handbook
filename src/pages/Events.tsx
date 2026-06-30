import { eventRecords } from "../data/appData";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { FormField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { DateInput, SelectInput, Textarea, TextInput, TimeInput } from "../components/ui/inputs";

export function Events() {
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
                <span>
                  <strong>{event.title}</strong>
                  <em>{event.date} · {event.location}</em>
                </span>
                <StatusChip label={event.status} tone={event.status === "Ready" ? "success" : "warning"} />
              </article>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Event Detail" />
          <div className="detail-card">
            <h2>{currentEvent.title}</h2>
            <p>{currentEvent.date} at {currentEvent.time}</p>
            <p>{currentEvent.location}</p>
            <div className="status-row">
              <StatusChip label={currentEvent.type} tone="accent" />
              <StatusChip label={`Flyer: ${currentEvent.flyerStatus}`} tone="neutral" />
            </div>
            <p>{currentEvent.notes}</p>
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
              <Button type="button" variant="primary">Save event</Button>
              <Button type="button" variant="ghost">Clear</Button>
            </div>
          </form>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}
