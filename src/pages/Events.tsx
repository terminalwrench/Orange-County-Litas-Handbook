import { useEffect, useState, type FormEvent } from "react";
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
import { getPastEvents, getUpcomingEvents, type EventSaveInput } from "../services/eventsService";
import type { PersistenceResult } from "../services/persistence";

interface EventsProps {
  eventRecords: EventRecord[];
  isLoading: boolean;
  isPersistenceConfigured: boolean;
  onSaveEvent: (input: EventSaveInput, previousId?: string) => Promise<PersistenceResult<EventRecord>>;
}

interface EventFormState {
  id?: string;
  title: string;
  startDate: string;
  time: string;
  location: string;
  city: string;
  type: string;
  status: string;
  flyerStatus: string;
  notes: string;
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
            Edit
          </Button>
        </article>
      ))}
    </div>
  );
}

const emptyEventForm: EventFormState = {
  title: "",
  startDate: "",
  time: "",
  location: "",
  city: "",
  type: "Meet & Greet",
  status: "Planning",
  flyerStatus: "Needed",
  notes: ""
};

export function Events({ eventRecords, isLoading, isPersistenceConfigured, onSaveEvent }: EventsProps) {
  const today = new Date();
  const upcomingEvents = sortAscendingByStartDate(getUpcomingEvents(eventRecords, today));
  const pastEvents = sortDescendingByStartDate(getPastEvents(eventRecords, today));
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [formState, setFormState] = useState<EventFormState>(emptyEventForm);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedEvent = eventRecords.find((event) => event.id === selectedEventId);
  const currentEvent = selectedEvent ?? upcomingEvents[0] ?? pastEvents[0];

  useEffect(() => {
    if (selectedEvent) {
      setFormState(toEventFormState(selectedEvent));
    }
  }, [selectedEvent]);

  function handleSelectEvent(event: EventRecord) {
    setSelectedEventId(event.id);
    setFormState(toEventFormState(event));
    setSaveMessage("");
    setSaveError("");
  }

  function handleNewEvent() {
    setSelectedEventId(undefined);
    setFormState(emptyEventForm);
    setSaveMessage("");
    setSaveError("");
  }

  function updateForm(field: keyof EventFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.title.trim() || !formState.startDate) {
      setSaveError("Event name and date are required.");
      setSaveMessage("");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const result = await onSaveEvent({
        id: selectedEventId,
        title: formState.title.trim(),
        type: formState.type,
        startDate: formState.startDate,
        endDate: formState.startDate,
        time: toDisplayTime(formState.time),
        location: formState.location.trim() || "TBD",
        city: formState.city.trim(),
        description: formState.notes.trim(),
        status: formState.status,
        flyerStatus: formState.flyerStatus,
        notes: formState.notes.trim()
      }, selectedEventId);

      setSelectedEventId(result.data.id);
      setFormState(toEventFormState(result.data));
      setSaveMessage(result.source === "supabase" ? "Event saved to Supabase." : "Event saved locally for this session.");
    } catch (error) {
      console.warn("[events] Event save failed.", error);
      setSaveError("Event could not be saved. Try again after checking the connection.");
    } finally {
      setIsSaving(false);
    }
  }

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
            <EventRows events={upcomingEvents} selectedId={selectedEventId} onSelect={handleSelectEvent} />
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
            <EventRows events={pastEvents} selectedId={selectedEventId} onSelect={handleSelectEvent} />
          ) : (
            <EmptyState title="No archived events yet" message="Past events will appear here automatically after their event dates pass." />
          )}
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Create / Edit Event" />
          <form className="form-grid" aria-label="Create or edit event" onSubmit={handleSubmit}>
            <FormField label="Event Name" htmlFor="event-name">
              <TextInput id="event-name" placeholder="Event name" value={formState.title} onChange={(event) => updateForm("title", event.target.value)} required />
            </FormField>
            <FormField label="Date" htmlFor="event-date">
              <DateInput id="event-date" value={formState.startDate} onChange={(event) => updateForm("startDate", event.target.value)} required />
            </FormField>
            <FormField label="Time" htmlFor="event-time">
              <TimeInput id="event-time" value={formState.time} onChange={(event) => updateForm("time", event.target.value)} />
            </FormField>
            <FormField label="Location" htmlFor="event-location">
              <TextInput id="event-location" placeholder="Venue or meetup point" value={formState.location} onChange={(event) => updateForm("location", event.target.value)} />
            </FormField>
            <FormField label="City" htmlFor="event-city">
              <TextInput id="event-city" placeholder="City, CA" value={formState.city} onChange={(event) => updateForm("city", event.target.value)} />
            </FormField>
            <FormField label="Event Type" htmlFor="event-type">
              <SelectInput id="event-type" value={formState.type} onChange={(event) => updateForm("type", event.target.value)}>
                <option>Meet & Greet</option>
                <option>Ride</option>
                <option>Community</option>
                <option>Special Event</option>
              </SelectInput>
            </FormField>
            <FormField label="Status" htmlFor="event-status">
              <SelectInput id="event-status" value={formState.status} onChange={(event) => updateForm("status", event.target.value)}>
                <option>Planning</option>
                <option>Ready</option>
                <option>Scheduled</option>
                <option>Completed</option>
              </SelectInput>
            </FormField>
            <FormField label="Flyer Status" htmlFor="flyer-status">
              <SelectInput id="flyer-status" value={formState.flyerStatus} onChange={(event) => updateForm("flyerStatus", event.target.value)}>
                <option>Needed</option>
                <option>Drafting</option>
                <option>Posted</option>
              </SelectInput>
            </FormField>
            <FormField label="Notes" htmlFor="event-notes">
              <Textarea
                id="event-notes"
                placeholder="Planning notes, route, attendance, flyer links, or follow-ups."
                value={formState.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
              />
            </FormField>
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save event"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleNewEvent}>New event</Button>
              <span className="form-note">
                {isPersistenceConfigured ? "Supabase persistence is configured." : "Fallback mode: saves stay local to this session."}
              </span>
            </div>
            {saveMessage ? <p className="form-status form-status--success">{saveMessage}</p> : null}
            {saveError ? <p className="form-status form-status--error">{saveError}</p> : null}
          </form>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

function toEventFormState(event: EventRecord): EventFormState {
  return {
    id: event.id,
    title: event.title,
    startDate: event.startDate,
    time: toTimeInputValue(event.time),
    location: event.location,
    city: event.city,
    type: event.type,
    status: event.status,
    flyerStatus: event.flyerStatus,
    notes: event.notes
  };
}

function toTimeInputValue(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return /^\d{2}:\d{2}$/.test(value) ? value : "";

  let hours = Number(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function toDisplayTime(value: string) {
  if (!value) return "TBD";

  const [hourValue, minutes] = value.split(":");
  const hours = Number(hourValue);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${period}`;
}
