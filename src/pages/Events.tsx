import { useState, type FormEvent } from "react";
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
import { getPastEvents, getUpcomingEvents, type CalendarImportResult, type EventSaveInput } from "../services/eventsService";
import type { PersistenceResult } from "../services/persistence";

interface EventsProps {
  eventRecords: EventRecord[];
  eventRecordsSource: "static" | "supabase" | "fallback" | "ics";
  isLoading: boolean;
  isPersistenceConfigured: boolean;
  onSaveEvent: (input: EventSaveInput) => Promise<PersistenceResult<EventRecord>>;
  onDeleteEvent: (event: EventRecord) => Promise<PersistenceResult<EventRecord>>;
  onImportCalendarEvents: () => Promise<CalendarImportResult>;
}

interface EventFormState {
  id?: string;
  externalUid?: string;
  title: string;
  startDate: string;
  time: string;
  location: string;
  city: string;
  type: string;
  status: string;
  notes: string;
}

const eventStatuses = ["Planning", "Ready", "Active", "Completed", "Cancelled"];
const eventTypes = ["Meet & Greet", "Ride", "Community", "Special Event"];
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

const emptyEventForm: EventFormState = {
  title: "",
  startDate: "",
  time: "",
  location: "",
  city: "",
  type: "Meet & Greet",
  status: "Planning",
  notes: ""
};

function parseEventDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getStatusTone(status: string) {
  if (status === "Ready" || status === "Active" || status === "Completed") return "success";
  if (status === "Planning") return "warning";
  return "neutral";
}

function sortAscendingByStartDate(events: EventRecord[]) {
  return [...events].sort((a, b) => parseEventDate(a.startDate).getTime() - parseEventDate(b.startDate).getTime());
}

function sortDescendingByStartDate(events: EventRecord[]) {
  return [...events].sort((a, b) => parseEventDate(b.startDate).getTime() - parseEventDate(a.startDate).getTime());
}

function EventRows({
  events,
  selectedId,
  savingId,
  onView,
  onEdit,
  onDelete
}: {
  events: EventRecord[];
  selectedId?: string;
  savingId: string | null;
  onView: (event: EventRecord) => void;
  onEdit: (event: EventRecord) => void;
  onDelete: (event: EventRecord) => void;
}) {
  return (
    <div className="record-list">
      {events.map((event) => (
        <article className={event.id === selectedId ? "event-record-row record-row--selected" : "event-record-row"} key={event.id}>
          <DateBadge
            month={monthFormatter.format(parseEventDate(event.startDate))}
            day={String(parseEventDate(event.startDate).getDate())}
            dateTime={event.startDate}
            compact
          />
          <span className="event-record-row__details">
            <strong>{event.title}</strong>
            <em>{event.time} · {event.location}</em>
          </span>
          <span className="event-record-row__status">
            <StatusChip label={event.status} tone={getStatusTone(event.status)} />
          </span>
          <div className="record-row__actions">
            <Button type="button" variant="ghost" onClick={() => onView(event)}>View</Button>
            <Button type="button" variant="ghost" onClick={() => onEdit(event)}>Edit</Button>
            <Button type="button" variant="ghost" onClick={() => onDelete(event)} disabled={savingId === event.id}>Delete</Button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function Events({
  eventRecords,
  eventRecordsSource,
  isLoading,
  isPersistenceConfigured,
  onSaveEvent,
  onDeleteEvent,
  onImportCalendarEvents
}: EventsProps) {
  const today = new Date();
  const upcomingEvents = sortAscendingByStartDate(getUpcomingEvents(eventRecords, today));
  const pastEvents = sortDescendingByStartDate(getPastEvents(eventRecords, today));
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [formState, setFormState] = useState<EventFormState>(emptyEventForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isImportingCalendar, setIsImportingCalendar] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const selectedEvent = eventRecords.find((event) => event.id === selectedEventId);
  const currentEvent = selectedEvent ?? upcomingEvents[0] ?? pastEvents[0];
  const isEditing = Boolean(formState.id);

  function handleViewEvent(event: EventRecord) {
    setSelectedEventId(event.id);
    setSaveMessage("");
    setSaveError("");
  }

  function openNewEventForm() {
    setFormState(emptyEventForm);
    setEditorOpen(true);
    setSelectedEventId(undefined);
    setSaveMessage("");
    setSaveError("");
  }

  function openEditForm(event: EventRecord) {
    setFormState(toEventFormState(event));
    setSelectedEventId(event.id);
    setEditorOpen(true);
    setSaveMessage("");
    setSaveError("");
  }

  function closeEditor() {
    setFormState(emptyEventForm);
    setEditorOpen(false);
    setSaveMessage("");
    setSaveError("");
  }

  function updateForm(field: keyof EventFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.title.trim() || !formState.startDate) {
      setSaveError("Event title and date are required.");
      setSaveMessage("");
      return;
    }

    setSavingId(formState.id ?? "new");
    setSaveError("");
    setSaveMessage("");

    try {
      const result = await onSaveEvent(toEventInput(formState));
      if (result.source === "fallback" && isPersistenceConfigured) {
        setSaveError("Event could not be saved to Supabase.");
      } else {
        setSelectedEventId(result.data.id);
        setFormState(toEventFormState(result.data));
        setSaveMessage(result.source === "supabase" ? (isEditing ? "Event updated." : "Event added.") : "Saved locally for this session.");
      }
    } catch (error) {
      console.warn("[events] Unable to save event.", error);
      setSaveError("Event could not be saved. Try again in a moment.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteEvent(event: EventRecord) {
    if (!window.confirm("Delete this event? This action cannot be undone.")) return;

    setSavingId(event.id);
    setSaveError("");
    setSaveMessage("");

    try {
      const result = await onDeleteEvent(event);
      if (result.source === "fallback" && isPersistenceConfigured) {
        setSaveError("Event could not be deleted from Supabase.");
      } else {
        setSaveMessage(result.source === "supabase" ? "Event deleted." : "Event deleted locally for this session.");
        if (selectedEventId === event.id) setSelectedEventId(undefined);
        if (formState.id === event.id) closeEditor();
      }
    } catch (error) {
      console.warn("[events] Unable to delete event.", error);
      setSaveError("Event could not be deleted. Try again in a moment.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleImportCalendar() {
    setIsImportingCalendar(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const result = await onImportCalendarEvents();

      if (result.error) {
        setSaveError(result.error);
        return;
      }

      setSaveMessage(`Calendar import complete. ${result.imported.length} imported, ${result.skipped} skipped.`);
    } catch (error) {
      console.warn("[events] Unable to import calendar feed.", error);
      setSaveError("Calendar import could not be completed. Existing Supabase events were kept.");
    } finally {
      setIsImportingCalendar(false);
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
          <SectionHeader
            title="Upcoming Events"
            action={(
              <div className="section-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleImportCalendar}
                  disabled={isImportingCalendar || !isPersistenceConfigured}
                  title={isPersistenceConfigured ? "Import from the public Google Calendar ICS feed." : "Connect Supabase before importing calendar events."}
                >
                  {isImportingCalendar ? "Importing..." : "Import calendar"}
                </Button>
                <Button type="button" variant="secondary" onClick={openNewEventForm}>Add event</Button>
              </div>
            )}
          />
          {isLoading ? (
            <EmptyState title="Loading events" message="Checking the configured event source." />
          ) : upcomingEvents.length > 0 ? (
            <EventRows
              events={upcomingEvents}
              selectedId={selectedEventId}
              savingId={savingId}
              onView={handleViewEvent}
              onEdit={openEditForm}
              onDelete={handleDeleteEvent}
            />
          ) : (
            <EmptyState title="No upcoming events." message="Events will appear here when they are added to Supabase." />
          )}
          {saveMessage ? <p className="form-status form-status--success">{saveMessage}</p> : null}
          {saveError ? <p className="form-status form-status--error">{saveError}</p> : null}
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
        {editorOpen ? (
          <DashboardCard className="span-all">
            <SectionHeader title={isEditing ? "Edit Event" : "Add Event"} />
            <form className="form-grid" aria-label={isEditing ? "Edit event" : "Add event"} onSubmit={handleSubmit}>
              <FormField label="Title" htmlFor="event-title">
                <TextInput id="event-title" value={formState.title} onChange={(event) => updateForm("title", event.target.value)} required />
              </FormField>
              <FormField label="Date" htmlFor="event-date">
                <DateInput id="event-date" value={formState.startDate} onChange={(event) => updateForm("startDate", event.target.value)} required />
              </FormField>
              <FormField label="Time" htmlFor="event-time">
                <TimeInput id="event-time" value={formState.time} onChange={(event) => updateForm("time", event.target.value)} />
              </FormField>
              <FormField label="Location" htmlFor="event-location">
                <TextInput id="event-location" value={formState.location} onChange={(event) => updateForm("location", event.target.value)} />
              </FormField>
              <FormField label="City" htmlFor="event-city">
                <TextInput id="event-city" value={formState.city} onChange={(event) => updateForm("city", event.target.value)} />
              </FormField>
              <FormField label="Event Type" htmlFor="event-type">
                <SelectInput id="event-type" value={formState.type} onChange={(event) => updateForm("type", event.target.value)}>
                  {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Status" htmlFor="event-status">
                <SelectInput id="event-status" value={formState.status} onChange={(event) => updateForm("status", event.target.value)}>
                  {eventStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Notes / Description" htmlFor="event-notes">
                <Textarea id="event-notes" value={formState.notes} onChange={(event) => updateForm("notes", event.target.value)} />
              </FormField>
              <div className="form-actions">
                <Button type="submit" variant="primary" disabled={savingId === formState.id || savingId === "new"}>
                  {savingId === formState.id || savingId === "new" ? "Saving..." : "Save event"}
                </Button>
                <Button type="button" variant="ghost" onClick={closeEditor}>Cancel</Button>
                <span className="form-note">
                  {isPersistenceConfigured ? "Saves to Supabase when available." : "Fallback mode: saves stay local to this session."}
                </span>
              </div>
            </form>
          </DashboardCard>
        ) : null}
        <DashboardCard className="span-all">
          <SectionHeader title="Past / History" />
          {pastEvents.length > 0 ? (
            <EventRows
              events={pastEvents}
              selectedId={selectedEventId}
              savingId={savingId}
              onView={handleViewEvent}
              onEdit={openEditForm}
              onDelete={handleDeleteEvent}
            />
          ) : (
            <EmptyState title="No archived events yet." message="Past events will appear here automatically after their event dates pass." />
          )}
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

function toEventFormState(event: EventRecord): EventFormState {
  return {
    id: event.id,
    externalUid: event.externalUid,
    title: event.title,
    startDate: event.startDate,
    time: toTimeInputValue(event.time),
    location: event.location === "TBD" ? "" : event.location,
    city: event.city,
    type: event.type,
    status: event.status,
    notes: event.notes || event.description
  };
}

function toEventInput(form: EventFormState): EventSaveInput {
  return {
    id: form.id,
    title: form.title.trim(),
    type: form.type,
    startDate: form.startDate,
    endDate: form.startDate,
    time: toDisplayTime(form.time),
    location: form.location.trim() || "TBD",
    city: form.city.trim(),
    description: form.notes.trim(),
    status: form.status,
    flyerStatus: "Needed",
    notes: form.notes.trim(),
    externalUid: form.externalUid
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
