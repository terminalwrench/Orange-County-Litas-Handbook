import { useEffect, useState, type FormEvent } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { DateBadge } from "../components/ui/DateBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { PreviewModal } from "../components/ui/PreviewModal";
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
  isCalendarImportAvailable: boolean;
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
  rideDifficulty: string;
  flyerUrl: string;
  groupPhotoUrl: string;
  routeImageUrl: string;
  instagramUrl: string;
  appleAlbumUrl: string;
  notes: string;
}

const eventStatuses = ["Planning", "Ready", "Completed", "Cancelled"];
const eventTypes = ["Meet & Greet", "Ride", "Community", "Special Event", "Major Event"];
const rideDifficulties = ["Beginner", "Intermediate", "Advanced"];
const HISTORY_BATCH_SIZE = 10;
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

const emptyEventForm: EventFormState = {
  title: "",
  startDate: "",
  time: "",
  location: "",
  city: "",
  type: "Meet & Greet",
  status: "Planning",
  rideDifficulty: "Beginner",
  flyerUrl: "",
  groupPhotoUrl: "",
  routeImageUrl: "",
  instagramUrl: "",
  appleAlbumUrl: "",
  notes: ""
};

function parseEventDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getStatusTone(status: string) {
  if (status === "Ready" || status === "Completed") return "success";
  if (status === "Planning") return "warning";
  return "neutral";
}

function getDisplayEventStatus(event: EventRecord, today = new Date()) {
  if (parseEventDate(event.startDate) < getStartOfToday(today)) return "Completed";
  return event.status;
}

function sortAscendingByStartDate(events: EventRecord[]) {
  return [...events].sort((a, b) => parseEventDate(a.startDate).getTime() - parseEventDate(b.startDate).getTime());
}

function sortDescendingByStartDate(events: EventRecord[]) {
  return [...events].sort((a, b) => parseEventDate(b.startDate).getTime() - parseEventDate(a.startDate).getTime());
}

function groupEventsByYear(events: EventRecord[]) {
  const groups = new Map<string, EventRecord[]>();

  events.forEach((event) => {
    const year = String(parseEventDate(event.startDate).getFullYear());
    groups.set(year, [...(groups.get(year) ?? []), event]);
  });

  return Array.from(groups.entries())
    .map(([year, yearEvents]) => ({
      year,
      events: sortDescendingByStartDate(yearEvents)
    }))
    .sort((a, b) => Number(b.year) - Number(a.year));
}

function EventRows({
  events,
  selectedId,
  onSelect,
  getDisplayStatus = (event) => event.status
}: {
  events: EventRecord[];
  selectedId?: string;
  onSelect: (event: EventRecord) => void;
  getDisplayStatus?: (event: EventRecord) => string;
}) {
  return (
    <div className="record-list">
      {events.map((event) => {
        const summary = formatEventRowSummary(event);
        const displayStatus = getDisplayStatus(event);

        return (
          <button
            className={event.id === selectedId ? "event-record-row record-row--selected" : "event-record-row"}
            type="button"
            key={event.id}
            onClick={() => onSelect(event)}
          >
            <DateBadge
              month={monthFormatter.format(parseEventDate(event.startDate))}
              day={String(parseEventDate(event.startDate).getDate())}
              dateTime={event.startDate}
              compact
            />
            <span className="event-record-row__details">
              <strong>{event.title}</strong>
              {summary ? <em>{summary}</em> : null}
            </span>
            <span className="event-record-row__status">
              <StatusChip label={displayStatus} tone={getStatusTone(displayStatus)} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EventHistoryByYear({
  events,
  selectedId,
  today,
  expandedYears,
  visibleCounts,
  onSelect,
  onToggleYear,
  onShowMore
}: {
  events: EventRecord[];
  selectedId?: string;
  today: Date;
  expandedYears: Record<string, boolean>;
  visibleCounts: Record<string, number>;
  onSelect: (event: EventRecord) => void;
  onToggleYear: (year: string) => void;
  onShowMore: (year: string) => void;
}) {
  const groups = groupEventsByYear(events);
  const currentYear = String(today.getFullYear());

  return (
    <div className="history-year-list">
      {groups.map((group) => {
        const isExpanded = expandedYears[group.year] ?? group.year === currentYear;
        const visibleCount = visibleCounts[group.year] ?? HISTORY_BATCH_SIZE;
        const visibleEvents = group.events.slice(0, visibleCount);
        const hiddenCount = group.events.length - visibleEvents.length;

        return (
          <section className="history-year" key={group.year}>
            <button className="history-year-header" type="button" onClick={() => onToggleYear(group.year)} aria-expanded={isExpanded}>
              <span>{group.year} — {group.events.length} {group.events.length === 1 ? "event" : "events"}</span>
              <em>{isExpanded ? "Collapse" : "Expand"}</em>
            </button>
            {isExpanded ? (
              <>
                <EventRows
                  events={visibleEvents}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  getDisplayStatus={(event) => getDisplayEventStatus(event, today)}
                />
                {hiddenCount > 0 ? (
                  <Button type="button" variant="ghost" onClick={() => onShowMore(group.year)}>
                    Show more
                  </Button>
                ) : null}
              </>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export function Events({
  eventRecords,
  isLoading,
  isPersistenceConfigured,
  isCalendarImportAvailable,
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
  const [previewMemory, setPreviewMemory] = useState<{ title: string; type: string; url: string; description?: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [expandedHistoryYears, setExpandedHistoryYears] = useState<Record<string, boolean>>({});
  const [visibleHistoryCounts, setVisibleHistoryCounts] = useState<Record<string, number>>({});
  const editorEvent = formState.id ? eventRecords.find((event) => event.id === formState.id) : undefined;
  const isEditing = Boolean(formState.id);
  const isCalendarImportDisabled = isImportingCalendar || !isPersistenceConfigured || !isCalendarImportAvailable;

  useEffect(() => {
    if (!selectedEventId) return;
    if (eventRecords.some((event) => event.id === selectedEventId)) return;

    setSelectedEventId(undefined);
    setEditorOpen(false);
    setFormState(emptyEventForm);
  }, [eventRecords, selectedEventId]);

  useEffect(() => {
    if (!editorOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeEditor();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorOpen]);

  function handleViewEvent(event: EventRecord) {
    openEditForm(event);
  }

  function openNewEventForm() {
    setFormState(emptyEventForm);
    setEditorOpen(true);
    setSelectedEventId(undefined);
    setSaveMessage("");
    setSaveError("");
  }

  function openEditForm(event: EventRecord) {
    setFormState({
      ...toEventFormState(event),
      status: getDisplayEventStatus(event, today)
    });
    setSelectedEventId(event.id);
    setEditorOpen(true);
    setSaveMessage("");
    setSaveError("");
  }

  function closeEditor() {
    setFormState(emptyEventForm);
    setEditorOpen(false);
    setSelectedEventId(undefined);
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
        setSaveError("Event could not be saved to the shared records.");
      } else {
        setSelectedEventId(result.data.id);
        setFormState(toEventFormState(result.data));
        setEditorOpen(false);
        setSaveMessage(result.source === "supabase" ? (isEditing ? "Event updated." : "Event added.") : "Saved locally for this session.");
      }
    } catch (error) {
      console.warn("[events] Unable to save event.", error);
      setSaveError("Event could not be saved to the shared records.");
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
        setSaveError("Event could not be deleted from the shared records.");
      } else {
        setSaveMessage(result.source === "supabase" ? "Event deleted." : "Event deleted locally for this session.");
        if (selectedEventId === event.id) setSelectedEventId(undefined);
        if (formState.id === event.id) {
          setFormState(emptyEventForm);
          setEditorOpen(false);
        }
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
      setSaveError("Calendar import could not be completed. Existing events were kept.");
    } finally {
      setIsImportingCalendar(false);
    }
  }

  function toggleHistoryYear(year: string) {
    setExpandedHistoryYears((current) => ({
      ...current,
      [year]: !(current[year] ?? year === String(today.getFullYear()))
    }));
  }

  function showMoreHistory(year: string) {
    setVisibleHistoryCounts((current) => ({
      ...current,
      [year]: (current[year] ?? HISTORY_BATCH_SIZE) + HISTORY_BATCH_SIZE
    }));
  }

  return (
    <PageContainer>
      <div className="page-title">
        <span>Events</span>
        <h1>Manage branch events</h1>
      </div>
      <div className="events-workspace">
        <DashboardCard>
          <SectionHeader
            title="Upcoming Events"
            action={(
              <div className="section-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleImportCalendar}
                  disabled={isCalendarImportDisabled}
                  title={getCalendarImportTitle(isPersistenceConfigured, isCalendarImportAvailable, isImportingCalendar)}
                >
                  {isImportingCalendar ? "Importing..." : "Import calendar"}
                </Button>
                <Button type="button" variant="secondary" onClick={openNewEventForm}>Add event</Button>
              </div>
            )}
          />
          {isLoading ? (
            <EmptyState title="Loading events" message="Checking the shared event records." />
          ) : upcomingEvents.length > 0 ? (
            <EventRows
              events={upcomingEvents}
              selectedId={selectedEventId}
              onSelect={handleViewEvent}
            />
          ) : (
            <EmptyState title="No upcoming events." message="Events will appear here when they are added." />
          )}
          {saveMessage ? <p className="form-status form-status--success">{saveMessage}</p> : null}
          {saveError ? <p className="form-status form-status--error">{saveError}</p> : null}
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Past / History" />
          {pastEvents.length > 0 ? (
            <EventHistoryByYear
              events={pastEvents}
              selectedId={selectedEventId}
              today={today}
              expandedYears={expandedHistoryYears}
              visibleCounts={visibleHistoryCounts}
              onSelect={handleViewEvent}
              onToggleYear={toggleHistoryYear}
              onShowMore={showMoreHistory}
            />
          ) : (
            <EmptyState title="No archived events yet." message="Past events will appear here automatically after their event dates pass." />
          )}
        </DashboardCard>
      </div>
      {editorOpen ? (
        <div className="slide-over-backdrop" role="presentation" onMouseDown={closeEditor}>
          <aside
            className="slide-over-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-slide-over-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="slide-over-panel__header">
              <div>
                <h2 id="event-slide-over-title">{formState.title || (isEditing ? "Untitled event" : "New event")}</h2>
                <span>{getSlideOverSubtitle(formState)}</span>
              </div>
              <Button type="button" variant="ghost" onClick={closeEditor}>Close</Button>
            </div>
            <form className="form-grid slide-over-form" aria-label={isEditing ? "Edit event" : "Add event"} onSubmit={handleSubmit}>
              <section className="slide-over-section">
                <h3>Event Information</h3>
                <div className="form-grid">
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
                  {formState.type === "Ride" ? (
                    <FormField label="Ride Difficulty" htmlFor="event-ride-difficulty">
                      <SelectInput
                        id="event-ride-difficulty"
                        value={formState.rideDifficulty}
                        onChange={(event) => updateForm("rideDifficulty", event.target.value)}
                      >
                        {rideDifficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                      </SelectInput>
                    </FormField>
                  ) : null}
                </div>
              </section>
              {formState.status === "Completed" ? (
                <section className="slide-over-section">
                  <h3>Media</h3>
                  <div className="form-grid">
                    <FormField label="Event Flyer URL" htmlFor="event-flyer-url">
                      <TextInput id="event-flyer-url" value={formState.flyerUrl} onChange={(event) => updateForm("flyerUrl", event.target.value)} />
                    </FormField>
                    <FormField label="Group Photo URL" htmlFor="event-group-photo-url">
                      <TextInput id="event-group-photo-url" value={formState.groupPhotoUrl} onChange={(event) => updateForm("groupPhotoUrl", event.target.value)} />
                    </FormField>
                    {formState.type === "Ride" ? (
                      <FormField label="Route Screenshot URL" htmlFor="event-route-image-url">
                        <TextInput id="event-route-image-url" value={formState.routeImageUrl} onChange={(event) => updateForm("routeImageUrl", event.target.value)} />
                      </FormField>
                    ) : null}
                    <FormField label="Instagram Link" htmlFor="event-instagram-url">
                      <TextInput id="event-instagram-url" value={formState.instagramUrl} onChange={(event) => updateForm("instagramUrl", event.target.value)} />
                    </FormField>
                    <FormField label="Apple Shared Album Link" htmlFor="event-apple-album-url">
                      <TextInput id="event-apple-album-url" value={formState.appleAlbumUrl} onChange={(event) => updateForm("appleAlbumUrl", event.target.value)} />
                    </FormField>
                  </div>
                </section>
              ) : null}
              <section className="slide-over-section">
                <h3>Notes</h3>
                <FormField label="Notes / Description" htmlFor="event-notes">
                  <Textarea id="event-notes" value={formState.notes} onChange={(event) => updateForm("notes", event.target.value)} />
                </FormField>
              </section>
              <section className="slide-over-section event-flyer-preview-panel" aria-labelledby="event-flyer-preview-title">
                <h3 id="event-flyer-preview-title">Flyer Preview</h3>
                {formState.flyerUrl ? (
                  <button
                    className="event-flyer-preview-button"
                    type="button"
                    onClick={() => setPreviewMemory({
                      title: formState.title || "Event Flyer",
                      type: "Flyer",
                      url: formState.flyerUrl,
                      description: formState.title
                    })}
                  >
                    <img src={formState.flyerUrl} alt={`${formState.title || "Event"} flyer`} />
                  </button>
                ) : (
                  <EmptyState title="No flyer attached." />
                )}
              </section>
              <section className="slide-over-section slide-over-section--actions">
                <h3>Actions</h3>
                <div className="form-actions">
                  <Button type="submit" variant="primary" disabled={savingId === formState.id || savingId === "new"}>
                    {savingId === formState.id || savingId === "new" ? "Saving..." : "Save event"}
                  </Button>
                  {isEditing && editorEvent ? (
                    <Button type="button" variant="ghost" onClick={() => handleDeleteEvent(editorEvent)} disabled={savingId === editorEvent.id}>
                      Delete
                    </Button>
                  ) : null}
                  <Button type="button" variant="ghost" onClick={closeEditor}>Cancel</Button>
                  <span className="form-note">
                    {isPersistenceConfigured ? "Changes save to the shared event records." : "Changes are kept for this browser session."}
                  </span>
                </div>
              </section>
              {saveMessage ? <p className="form-status form-status--success">{saveMessage}</p> : null}
              {saveError ? <p className="form-status form-status--error">{saveError}</p> : null}
            </form>
          </aside>
        </div>
      ) : null}
      {previewMemory ? (
        <PreviewModal
          title={previewMemory.title}
          subtitle={previewMemory.type}
          description={previewMemory.description}
          imageUrl={previewMemory.url}
          onClose={() => setPreviewMemory(null)}
        />
      ) : null}
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
    location: isMeaningfulEventValue(event.location) ? event.location : "",
    city: event.city,
    type: event.type,
    status: event.status,
    rideDifficulty: event.rideDifficulty ?? "Beginner",
    flyerUrl: event.flyerUrl ?? "",
    groupPhotoUrl: event.groupPhotoUrl ?? "",
    routeImageUrl: event.routeImageUrl ?? "",
    instagramUrl: event.instagramUrl ?? "",
    appleAlbumUrl: event.appleAlbumUrl ?? "",
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
    location: form.location.trim(),
    city: form.city.trim(),
    description: form.notes.trim(),
    status: form.status,
    flyerStatus: "Needed",
    notes: form.notes.trim(),
    rideDifficulty: form.type === "Ride" ? form.rideDifficulty : undefined,
    flyerUrl: form.flyerUrl.trim() || undefined,
    groupPhotoUrl: form.groupPhotoUrl.trim() || undefined,
    routeImageUrl: form.type === "Ride" ? form.routeImageUrl.trim() || undefined : undefined,
    instagramUrl: form.instagramUrl.trim() || undefined,
    appleAlbumUrl: form.appleAlbumUrl.trim() || undefined,
    externalUid: form.externalUid
  };
}

function getCalendarImportTitle(
  isPersistenceConfigured: boolean,
  isCalendarImportAvailable: boolean,
  isImportingCalendar: boolean
) {
  if (isImportingCalendar) return "Calendar import is already running.";
  if (!isPersistenceConfigured) return "Connect the shared event records before importing calendar events.";
  if (!isCalendarImportAvailable) return "Configure VITE_EVENTS_ICS_URL before importing calendar events.";
  return "Import from the configured Google Calendar ICS feed.";
}

function formatEventRowSummary(event: EventRecord) {
  return [event.time, event.location]
    .filter(isMeaningfulEventValue)
    .join(" · ");
}

function getSlideOverSubtitle(form: EventFormState) {
  return [form.type, form.status, formatSlideOverDate(form.startDate)]
    .filter(isMeaningfulEventValue)
    .join(" • ");
}

function formatSlideOverDate(value: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseEventDate(value));
}

function getStartOfToday(today = new Date()) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function isMeaningfulEventValue(value: string | undefined | null) {
  const normalized = value?.trim();
  if (!normalized) return false;

  return !["tbd", "n/a", "not provided", "none", "-", "—"].includes(normalized.toLowerCase());
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
  if (!value) return "";

  const [hourValue, minutes] = value.split(":");
  const hours = Number(hourValue);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${period}`;
}
