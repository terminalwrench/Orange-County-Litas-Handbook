import { useEffect, useMemo, useRef, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { DateBadge } from "../components/ui/DateBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { DateInput, SelectInput, Textarea, TextInput, TimeInput } from "../components/ui/inputs";
import type { EventRecord, RideRecord, RideStop } from "../types";
import { getUpcomingRides, type RideSaveInput } from "../services/ridesService";
import type { PersistenceResult } from "../services/persistence";
import { getBranchSettings } from "../services/settingsService";

interface RidePlannerProps {
  eventRecords: EventRecord[];
  rideRecords: RideRecord[];
  rideRecordsSource: "static" | "supabase" | "fallback";
  isLoading: boolean;
  isPersistenceConfigured: boolean;
  onSaveRide: (input: RideSaveInput) => Promise<PersistenceResult<RideRecord>>;
  onDeleteRide: (ride: RideRecord) => Promise<PersistenceResult<RideRecord>>;
}

interface RidePlan {
  id: string;
  recordId?: string;
  eventId?: string;
  title: string;
  date: string;
  status: string;
  rideLeader: string;
  sweep: string;
  difficulty: string;
  estimatedDistance: string;
  estimatedRideTime: string;
  freeways: boolean;
  startingLocation: string;
  kickstandsUp: string;
  primaryRouteLink: string;
  alternativeRouteLink: string;
  totalDistance: string;
  routeDuration: string;
  destination: string;
  rideType: string;
  visibility: string;
  weatherPolicy: string;
  stops: RideStop[];
  notes: string;
}

type RideFieldValue = string | boolean | RideStop[];

const memberOptions = getBranchSettings().currentCofounders;
const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];
const statusOptions = ["Planning", "Ready", "Completed", "Cancelled"];
const rideTimeOptions = ["Flexible", "Under 1 hour", "1–2 hours", "2–4 hours", "4+ hours"];
const stopTypeOptions = ["Gas", "Food", "Restroom", "Photo", "Meetup", "Scenic", "Other"];
const rideTypeOptions = ["Beginner Ride", "Intermediate Ride", "Advanced Ride", "Group Ride", "Poker Run", "Meet & Greet Ride", "Overnight", "Charity Ride", "Other"];
const visibilityOptions = ["Founders Only", "Chapter Only", "Public"];
const weatherPolicyOptions = ["Rain Cancels", "Rain or Shine", "Leader Decision"];

export function RidePlanner({
  eventRecords,
  rideRecords,
  rideRecordsSource,
  isLoading,
  isPersistenceConfigured,
  onSaveRide,
  onDeleteRide
}: RidePlannerProps) {
  const ridePlans = useMemo(() => buildRidePlans(eventRecords, rideRecords), [eventRecords, rideRecords]);
  const [expandedRideId, setExpandedRideId] = useState<string | undefined>();
  const [hasInitializedQueue, setHasInitializedQueue] = useState(false);
  const selectedRide = expandedRideId ? ridePlans.find((ride) => ride.id === expandedRideId) : undefined;
  const [formState, setFormState] = useState<RidePlan | null>(selectedRide ?? null);
  const [newRideState, setNewRideState] = useState<RidePlan>(() => createBlankRidePlan());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [newRideMessage, setNewRideMessage] = useState("");
  const [newRideError, setNewRideError] = useState("");
  const newRideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ridePlans.length === 0) {
      setExpandedRideId(undefined);
      setFormState(null);
      return;
    }

    if (!hasInitializedQueue) {
      setExpandedRideId(ridePlans[0].id);
      setHasInitializedQueue(true);
      return;
    }

    if (expandedRideId && !ridePlans.some((ride) => ride.id === expandedRideId)) {
      setExpandedRideId(ridePlans[0].id);
    }
  }, [expandedRideId, hasInitializedQueue, ridePlans]);

  useEffect(() => {
    setFormState(selectedRide ?? null);
    setSaveMessage("");
    setSaveError("");
  }, [selectedRide?.id]);

  function toggleRide(ride: RidePlan) {
    setExpandedRideId((current) => current === ride.id ? undefined : ride.id);
    setSaveMessage("");
    setSaveError("");
  }

  function startNewRide() {
    newRideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setNewRideMessage("");
    setNewRideError("");
  }

  function updateField(field: keyof RidePlan, value: RideFieldValue) {
    setFormState((current) => current ? { ...current, [field]: value } : current);
  }

  function updateNewRideField(field: keyof RidePlan, value: RideFieldValue) {
    setNewRideState((current) => ({ ...current, [field]: value }));
  }

  function updateStop(stopId: string, field: keyof RideStop, value: string) {
    setFormState((current) => current ? updateStopsForRide(current, stopId, field, value) : current);
  }

  function updateNewRideStop(stopId: string, field: keyof RideStop, value: string) {
    setNewRideState((current) => updateStopsForRide(current, stopId, field, value));
  }

  function addStop() {
    setFormState((current) => current ? addStopToRide(current) : current);
  }

  function addNewRideStop() {
    setNewRideState((current) => addStopToRide(current));
  }

  function removeStop(stopId: string) {
    setFormState((current) => current ? removeStopFromRide(current, stopId) : current);
  }

  function removeNewRideStop(stopId: string) {
    setNewRideState((current) => removeStopFromRide(current, stopId));
  }

  function moveStop(stopId: string, direction: -1 | 1) {
    setFormState((current) => current ? moveStopInRide(current, stopId, direction) : current);
  }

  function moveNewRideStop(stopId: string, direction: -1 | 1) {
    setNewRideState((current) => moveStopInRide(current, stopId, direction));
  }

  async function handleSaveRide() {
    if (!formState) return;

    await saveRidePlan(formState, "existing");
  }

  async function handleSaveNewRide() {
    await saveRidePlan(newRideState, "new");
  }

  async function saveRidePlan(ride: RidePlan, mode: "existing" | "new") {
    if (!ride.title.trim() || !ride.date) {
      if (mode === "new") {
        setNewRideMessage("");
        setNewRideError("Ride name and date are required.");
        return;
      }

      setSaveMessage("");
      setSaveError("Ride name and date are required.");
      return;
    }

    setSavingId(ride.id);
    if (mode === "new") {
      setNewRideMessage("");
      setNewRideError("");
    } else {
      setSaveMessage("");
      setSaveError("");
    }

    try {
      const result = await onSaveRide(toRideSaveInput(ride));

      if (result.source === "fallback" && isPersistenceConfigured) {
        if (mode === "new") {
          setNewRideError("Ride could not be saved to the shared ride records.");
        } else {
          setSaveError("Ride could not be saved to the shared ride records.");
        }
      } else {
        const savedRide = fromSavedRide(result.data);
        setExpandedRideId(result.data.id);
        setFormState(savedRide);

        if (mode === "new") {
          setNewRideState(createBlankRidePlan());
          setNewRideMessage(result.source === "supabase" ? "Ride plan created." : "Saved locally for this session.");
        } else {
          setSaveMessage(result.source === "supabase" ? "Ride plan saved." : "Saved locally for this session.");
        }
      }
    } catch (error) {
      console.warn("[ride-planner] Unable to save ride.", error);
      if (mode === "new") {
        setNewRideError("Ride could not be saved. Try again in a moment.");
      } else {
        setSaveError("Ride could not be saved. Try again in a moment.");
      }
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteRide() {
    if (!formState?.recordId) return;
    if (!window.confirm("Delete this ride plan? This action cannot be undone.")) return;

    setSavingId(formState.id);
    setSaveMessage("");
    setSaveError("");

    try {
      const result = await onDeleteRide(toRideRecord(formState));

      if (result.source === "fallback" && isPersistenceConfigured) {
        setSaveError("Ride could not be deleted from the shared ride records.");
      } else {
        setExpandedRideId(undefined);
        setFormState(null);
        setSaveMessage(result.source === "supabase" ? "Ride plan deleted." : "Ride deleted locally for this session.");
      }
    } catch (error) {
      console.warn("[ride-planner] Unable to delete ride.", error);
      setSaveError("Ride could not be deleted. Try again in a moment.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageContainer>
      <div className="page-title">
        <span>Ride Planner</span>
        <h1>Build the ride plan</h1>
      </div>
      <div className="ride-planner-flow">
        <DashboardCard>
          <SectionHeader title="Ride Queue" action={<Button type="button" variant="secondary" onClick={startNewRide}>Add Ride</Button>} />
          {isLoading ? (
            <EmptyState title="Loading rides" message="Checking the shared ride records." />
          ) : ridePlans.length > 0 ? (
            <div className="ride-accordion-list">
              {ridePlans.map((ride) => {
                const isExpanded = ride.id === expandedRideId;

                return (
                  <article className={isExpanded ? "ride-accordion-item ride-accordion-item--expanded" : "ride-accordion-item"} key={ride.id}>
                    <button
                      className={isExpanded ? "event-record-row record-row--selected ride-accordion-row" : "event-record-row ride-accordion-row"}
                      type="button"
                      onClick={() => toggleRide(ride)}
                      aria-expanded={isExpanded}
                    >
                      <DateBadge
                        month={getRideMonth(ride.date)}
                        day={getRideDay(ride.date)}
                        dateTime={ride.date}
                        compact
                      />
                      <span className="event-record-row__details">
                        <strong>{ride.title || "Untitled ride"}</strong>
                        <em>{ride.date || "Date not set"} · {ride.startingLocation || "Starting location not set"}</em>
                      </span>
                      <span className="event-record-row__status">
                        <StatusChip label={ride.status} tone={getStatusTone(ride.status)} />
                      </span>
                      <span className="ride-accordion-row__chevron" aria-hidden="true">{isExpanded ? "⌃" : "⌄"}</span>
                    </button>
                    {isExpanded && formState ? (
                      <RidePlannerEditor
                        ride={formState}
                        idPrefix={`ride-${ride.id}`}
                        savingId={savingId}
                        saveMessage={saveMessage}
                        saveError={saveError}
                        isPersistenceConfigured={isPersistenceConfigured}
                        onUpdateField={updateField}
                        onUpdateStop={updateStop}
                        onAddStop={addStop}
                        onRemoveStop={removeStop}
                        onMoveStop={moveStop}
                        onSave={handleSaveRide}
                        onDelete={handleDeleteRide}
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No ride plans available." message="Ride plans will appear here when ride events or saved routes are available." />
          )}
          <p className="form-note">
            {getSourceNote(rideRecordsSource, isPersistenceConfigured)}
          </p>
        </DashboardCard>
        <div ref={newRideRef}>
          <DashboardCard className="new-ride-card">
            <SectionHeader title="New Ride" />
            <RidePlannerEditor
              ride={newRideState}
              idPrefix="new-ride"
              savingId={savingId}
              saveMessage={newRideMessage}
              saveError={newRideError}
              isPersistenceConfigured={isPersistenceConfigured}
              onUpdateField={updateNewRideField}
              onUpdateStop={updateNewRideStop}
              onAddStop={addNewRideStop}
              onRemoveStop={removeNewRideStop}
              onMoveStop={moveNewRideStop}
              onSave={handleSaveNewRide}
            />
          </DashboardCard>
        </div>
      </div>
    </PageContainer>
  );
}

function RidePlannerEditor({
  ride,
  idPrefix,
  savingId,
  saveMessage,
  saveError,
  isPersistenceConfigured,
  onUpdateField,
  onUpdateStop,
  onAddStop,
  onRemoveStop,
  onMoveStop,
  onSave,
  onDelete
}: {
  ride: RidePlan;
  idPrefix: string;
  savingId: string | null;
  saveMessage: string;
  saveError: string;
  isPersistenceConfigured: boolean;
  onUpdateField: (field: keyof RidePlan, value: RideFieldValue) => void;
  onUpdateStop: (stopId: string, field: keyof RideStop, value: string) => void;
  onAddStop: () => void;
  onRemoveStop: (stopId: string) => void;
  onMoveStop: (stopId: string, direction: -1 | 1) => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const isSaving = savingId === ride.id;

  return (
    <div className="ride-inline-planner">
      <section className="ride-planner-section">
        <SectionHeader
          title="Ride Overview"
          action={(
            <Button type="button" variant="secondary" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save ride"}
            </Button>
          )}
        />
        <div className="form-grid">
          <FormField label="Ride Leader" htmlFor={`${idPrefix}-leader`}>
            <SelectInput id={`${idPrefix}-leader`} value={ride.rideLeader} onChange={(event) => onUpdateField("rideLeader", event.target.value)}>
              <option value="">Blank</option>
              {memberOptions.map((member) => <option key={member} value={member}>{member}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Ride Name" htmlFor={`${idPrefix}-name`}>
            <TextInput id={`${idPrefix}-name`} value={ride.title} onChange={(event) => onUpdateField("title", event.target.value)} />
          </FormField>
          <FormField label="Date" htmlFor={`${idPrefix}-date`}>
            <DateInput id={`${idPrefix}-date`} value={ride.date} onChange={(event) => onUpdateField("date", event.target.value)} />
          </FormField>
          <FormField label="Sweep" htmlFor={`${idPrefix}-sweep`}>
            <SelectInput id={`${idPrefix}-sweep`} value={ride.sweep} onChange={(event) => onUpdateField("sweep", event.target.value)}>
              <option value="">Blank</option>
              {memberOptions.map((member) => <option key={member} value={member}>{member}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Difficulty" htmlFor={`${idPrefix}-difficulty`}>
            <SelectInput id={`${idPrefix}-difficulty`} value={ride.difficulty} onChange={(event) => onUpdateField("difficulty", event.target.value)}>
              {difficultyOptions.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Status" htmlFor={`${idPrefix}-status`}>
            <SelectInput id={`${idPrefix}-status`} value={ride.status} onChange={(event) => onUpdateField("status", event.target.value)}>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Estimated Distance" htmlFor={`${idPrefix}-distance`}>
            <TextInput id={`${idPrefix}-distance`} type="number" min="0" inputMode="decimal" value={ride.estimatedDistance} onChange={(event) => onUpdateField("estimatedDistance", event.target.value)} />
          </FormField>
          <FormField label="Estimated Ride Time" htmlFor={`${idPrefix}-duration`}>
            <SelectInput id={`${idPrefix}-duration`} value={ride.estimatedRideTime} onChange={(event) => onUpdateField("estimatedRideTime", event.target.value)}>
              {rideTimeOptions.map((duration) => <option key={duration} value={duration}>{duration}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Ride Type" htmlFor={`${idPrefix}-type`}>
            <SelectInput id={`${idPrefix}-type`} value={ride.rideType} onChange={(event) => onUpdateField("rideType", event.target.value)}>
              {rideTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Visibility" htmlFor={`${idPrefix}-visibility`}>
            <SelectInput id={`${idPrefix}-visibility`} value={ride.visibility} onChange={(event) => onUpdateField("visibility", event.target.value)}>
              {visibilityOptions.map((visibility) => <option key={visibility} value={visibility}>{visibility}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Weather Policy" htmlFor={`${idPrefix}-weather-policy`}>
            <SelectInput id={`${idPrefix}-weather-policy`} value={ride.weatherPolicy} onChange={(event) => onUpdateField("weatherPolicy", event.target.value)}>
              {weatherPolicyOptions.map((policy) => <option key={policy} value={policy}>{policy}</option>)}
            </SelectInput>
          </FormField>
        </div>
      </section>
      <section className="ride-planner-section">
        <SectionHeader title="Route Plan" action={<Button type="button" variant="secondary" onClick={onAddStop}>+ Add Stop</Button>} />
        <div className="form-grid">
          <FormField label="Starting Location" htmlFor={`${idPrefix}-starting-location`}>
            <TextInput id={`${idPrefix}-starting-location`} value={ride.startingLocation} onChange={(event) => onUpdateField("startingLocation", event.target.value)} />
          </FormField>
          <FormField label="Meetup Time" htmlFor={`${idPrefix}-kickstands-up`}>
            <TimeInput id={`${idPrefix}-kickstands-up`} value={ride.kickstandsUp} onChange={(event) => onUpdateField("kickstandsUp", event.target.value)} />
          </FormField>
          <FormField label="Primary Route Link" htmlFor={`${idPrefix}-primary-route`}>
            <TextInput id={`${idPrefix}-primary-route`} type="url" value={ride.primaryRouteLink} onChange={(event) => onUpdateField("primaryRouteLink", event.target.value)} />
          </FormField>
          <FormField label="Alternative Route Link" htmlFor={`${idPrefix}-alternative-route`}>
            <TextInput id={`${idPrefix}-alternative-route`} type="url" value={ride.alternativeRouteLink} onChange={(event) => onUpdateField("alternativeRouteLink", event.target.value)} />
          </FormField>
          <FormField label="Total Distance" htmlFor={`${idPrefix}-total-distance`}>
            <TextInput id={`${idPrefix}-total-distance`} type="number" min="0" inputMode="decimal" value={ride.totalDistance} onChange={(event) => onUpdateField("totalDistance", event.target.value)} />
          </FormField>
          <FormField label="Estimated Ride Time" htmlFor={`${idPrefix}-route-duration`}>
            <SelectInput id={`${idPrefix}-route-duration`} value={ride.routeDuration} onChange={(event) => onUpdateField("routeDuration", event.target.value)}>
              <option value="">No override</option>
              {rideTimeOptions.map((duration) => <option key={duration} value={duration}>{duration}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Destination" htmlFor={`${idPrefix}-destination`}>
            <TextInput id={`${idPrefix}-destination`} value={ride.destination} onChange={(event) => onUpdateField("destination", event.target.value)} />
          </FormField>
        </div>
        {ride.stops.length > 0 ? (
          <div className="ride-stop-list">
            {ride.stops.map((stop, index) => (
              <article className="ride-stop-row" key={stop.id}>
                <div className="form-grid">
                  <FormField label="Stop Type" htmlFor={`${idPrefix}-stop-type-${stop.id}`}>
                    <SelectInput id={`${idPrefix}-stop-type-${stop.id}`} value={stop.type} onChange={(event) => onUpdateStop(stop.id, "type", event.target.value)}>
                      {stopTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                    </SelectInput>
                  </FormField>
                  <FormField label="Location" htmlFor={`${idPrefix}-stop-location-${stop.id}`}>
                    <TextInput id={`${idPrefix}-stop-location-${stop.id}`} value={stop.location} onChange={(event) => onUpdateStop(stop.id, "location", event.target.value)} />
                  </FormField>
                  <FormField label="Arrival Time" htmlFor={`${idPrefix}-stop-arrival-${stop.id}`}>
                    <TimeInput id={`${idPrefix}-stop-arrival-${stop.id}`} value={stop.arrivalTime ?? ""} onChange={(event) => onUpdateStop(stop.id, "arrivalTime", event.target.value)} />
                  </FormField>
                  <FormField label="Notes" htmlFor={`${idPrefix}-stop-notes-${stop.id}`}>
                    <TextInput id={`${idPrefix}-stop-notes-${stop.id}`} value={stop.notes ?? ""} onChange={(event) => onUpdateStop(stop.id, "notes", event.target.value)} />
                  </FormField>
                </div>
                <div className="record-row__actions">
                  <Button type="button" variant="ghost" onClick={() => onMoveStop(stop.id, -1)} disabled={index === 0}>Up</Button>
                  <Button type="button" variant="ghost" onClick={() => onMoveStop(stop.id, 1)} disabled={index === ride.stops.length - 1}>Down</Button>
                  <Button type="button" variant="ghost" onClick={() => onRemoveStop(stop.id)}>Remove</Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No stops added" message="Add gas, food, restroom, photo, meetup, scenic, or other ride stops." />
        )}
      </section>
      <section className="ride-planner-section">
        <SectionHeader title="Safety" />
        <div className="form-grid">
          <FormField label="Freeways" htmlFor={`${idPrefix}-freeways`}>
            <SelectInput id={`${idPrefix}-freeways`} value={ride.freeways ? "yes" : "no"} onChange={(event) => onUpdateField("freeways", event.target.value === "yes")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </SelectInput>
          </FormField>
        </div>
      </section>
      <section className="ride-planner-section">
        <SectionHeader title="Notes" />
        <FormField label="Ride Notes" htmlFor={`${idPrefix}-notes`}>
          <Textarea id={`${idPrefix}-notes`} value={ride.notes} onChange={(event) => onUpdateField("notes", event.target.value)} />
        </FormField>
      </section>
      <section className="ride-planner-section ride-planner-actions">
        <div className="form-actions">
          <Button type="button" variant="primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save ride"}
          </Button>
          {onDelete ? (
            <Button type="button" variant="ghost" onClick={onDelete} disabled={!ride.recordId || isSaving}>
              Delete ride
            </Button>
          ) : null}
          <span className="form-note">
            {isPersistenceConfigured ? "Changes save to the shared ride records." : "Changes are kept for this browser session."}
          </span>
        </div>
        {saveMessage ? <p className="form-status form-status--success">{saveMessage}</p> : null}
        {saveError ? <p className="form-status form-status--error">{saveError}</p> : null}
      </section>
    </div>
  );
}

function updateStopsForRide(ride: RidePlan, stopId: string, field: keyof RideStop, value: string): RidePlan {
  return {
    ...ride,
    stops: ride.stops.map((stop) => stop.id === stopId ? { ...stop, [field]: value } : stop)
  };
}

function addStopToRide(ride: RidePlan): RidePlan {
  return {
    ...ride,
    stops: [
      ...ride.stops,
      {
        id: createLocalStopId(),
        type: "Meetup",
        location: "",
        arrivalTime: "",
        notes: ""
      }
    ]
  };
}

function removeStopFromRide(ride: RidePlan, stopId: string): RidePlan {
  return {
    ...ride,
    stops: ride.stops.filter((stop) => stop.id !== stopId)
  };
}

function moveStopInRide(ride: RidePlan, stopId: string, direction: -1 | 1): RidePlan {
  const currentIndex = ride.stops.findIndex((stop) => stop.id === stopId);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ride.stops.length) return ride;

  const stops = [...ride.stops];
  const [stop] = stops.splice(currentIndex, 1);
  stops.splice(nextIndex, 0, stop);

  return { ...ride, stops };
}

function buildRidePlans(events: EventRecord[], rides: RideRecord[]): RidePlan[] {
  const savedEventIds = new Set(rides.map((ride) => ride.eventId).filter(Boolean));
  const eventPlans = getUpcomingRides(events)
    .filter((event) => !savedEventIds.has(event.id))
    .map(fromRideEvent);
  const savedRidePlans = getUpcomingSavedRides(rides).map(fromSavedRide);
  return [...eventPlans, ...savedRidePlans];
}

function fromRideEvent(event: EventRecord): RidePlan {
  const difficulty = normalizeDifficulty(event.rideDifficulty);

  return {
    id: `event-${event.id}`,
    eventId: event.id,
    title: event.title,
    date: event.startDate,
    status: normalizeStatus(event.status),
    rideLeader: "",
    sweep: "",
    difficulty,
    estimatedDistance: "",
    estimatedRideTime: "Flexible",
    freeways: false,
    startingLocation: event.location || "",
    kickstandsUp: toTimeInputValue(event.time),
    primaryRouteLink: "",
    alternativeRouteLink: "",
    totalDistance: "",
    routeDuration: "",
    destination: event.city || "",
    rideType: difficulty === "Beginner" ? "Beginner Ride" : "Group Ride",
    visibility: "Chapter Only",
    weatherPolicy: "Leader Decision",
    stops: [],
    notes: event.notes || event.description
  };
}

function fromSavedRide(ride: RideRecord): RidePlan {
  return {
    id: ride.id,
    recordId: ride.id,
    eventId: ride.eventId,
    title: ride.title,
    date: ride.date,
    status: normalizeStatus(ride.status),
    rideLeader: ride.rideLeader ?? "",
    sweep: ride.sweep ?? "",
    difficulty: normalizeDifficulty(ride.difficulty),
    estimatedDistance: ride.estimatedDistance ?? ride.mileage ?? "",
    estimatedRideTime: ride.estimatedRideTime ?? ride.duration ?? "Flexible",
    freeways: ride.freeways ?? false,
    startingLocation: ride.startingLocation ?? ride.meetup ?? "",
    kickstandsUp: ride.meetupTime ?? ride.kickstandsUp ?? toTimeInputValue(ride.time ?? ""),
    primaryRouteLink: ride.primaryRouteLink ?? "",
    alternativeRouteLink: ride.alternativeRouteLink ?? "",
    totalDistance: ride.totalDistance ?? ride.mileage ?? "",
    routeDuration: ride.routeDuration ?? "",
    destination: ride.destination ?? "",
    rideType: ride.rideType ?? "Group Ride",
    visibility: ride.visibility ?? "Chapter Only",
    weatherPolicy: ride.weatherPolicy ?? "Leader Decision",
    stops: ride.stops ?? [],
    notes: ride.notes
  };
}

function toRideSaveInput(ride: RidePlan): RideSaveInput {
  return {
    id: ride.recordId,
    eventId: ride.eventId,
    title: ride.title,
    date: ride.date,
    status: ride.status,
    rideLeader: ride.rideLeader || undefined,
    sweep: ride.sweep || undefined,
    difficulty: ride.difficulty,
    estimatedDistance: ride.estimatedDistance,
    estimatedRideTime: ride.estimatedRideTime,
    freeways: ride.freeways,
    meetupTime: ride.kickstandsUp,
    startingLocation: ride.startingLocation,
    kickstandsUp: ride.kickstandsUp,
    primaryRouteLink: ride.primaryRouteLink,
    alternativeRouteLink: ride.alternativeRouteLink,
    totalDistance: ride.totalDistance,
    routeDuration: ride.routeDuration,
    destination: ride.destination,
    rideType: ride.rideType,
    visibility: ride.visibility,
    weatherPolicy: ride.weatherPolicy,
    stops: ride.stops,
    notes: ride.notes
  };
}

function toRideRecord(ride: RidePlan): RideRecord {
  return {
    id: ride.recordId ?? ride.id,
    eventId: ride.eventId,
    title: ride.title,
    date: ride.date,
    status: ride.status,
    meetup: ride.startingLocation,
    destination: ride.destination,
    mileage: ride.estimatedDistance,
    duration: ride.estimatedRideTime,
    difficulty: ride.difficulty,
    rideLeader: ride.rideLeader || undefined,
    sweep: ride.sweep || undefined,
    estimatedDistance: ride.estimatedDistance,
    estimatedRideTime: ride.estimatedRideTime,
    freeways: ride.freeways,
    meetupTime: ride.kickstandsUp,
    startingLocation: ride.startingLocation,
    kickstandsUp: ride.kickstandsUp,
    primaryRouteLink: ride.primaryRouteLink,
    alternativeRouteLink: ride.alternativeRouteLink,
    totalDistance: ride.totalDistance,
    routeDuration: ride.routeDuration,
    rideType: ride.rideType,
    visibility: ride.visibility,
    weatherPolicy: ride.weatherPolicy,
    stops: ride.stops,
    notes: ride.notes
  };
}

function createBlankRidePlan(): RidePlan {
  return {
    id: createLocalRideId(),
    title: "",
    date: "",
    status: "Planning",
    rideLeader: "",
    sweep: "",
    difficulty: "Beginner",
    estimatedDistance: "",
    estimatedRideTime: "Flexible",
    freeways: false,
    startingLocation: "",
    kickstandsUp: "",
    primaryRouteLink: "",
    alternativeRouteLink: "",
    totalDistance: "",
    routeDuration: "",
    destination: "",
    rideType: "Group Ride",
    visibility: "Chapter Only",
    weatherPolicy: "Leader Decision",
    stops: [],
    notes: ""
  };
}

function normalizeDifficulty(value = "") {
  if (value.includes("Advanced")) return "Advanced";
  if (value.includes("Intermediate")) return "Intermediate";
  return "Beginner";
}

function normalizeStatus(value = "") {
  if (value === "Pending") return "Planning";
  if (statusOptions.includes(value)) return value;
  return "Planning";
}

function getStatusTone(status: string) {
  if (status === "Ready" || status === "Completed") return "success";
  if (status === "Planning") return "warning";
  return "neutral";
}

function getSourceNote(source: RidePlannerProps["rideRecordsSource"], isPersistenceConfigured: boolean) {
  if (source === "supabase") return "";
  if (isPersistenceConfigured) return "Shared ride records could not be reached, so saved backup records are shown.";
  return "Sample ride records are shown until the shared ride source is connected.";
}

function getRideMonth(date: string) {
  if (!date) return "Date";

  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(`${date}T00:00:00`));
}

function getRideDay(date: string) {
  if (!date) return "-";

  return String(new Date(`${date}T00:00:00`).getDate());
}

function getUpcomingSavedRides(rides: RideRecord[]) {
  const today = new Date(new Date().toDateString());

  return [...rides]
    .filter((ride) => ride.date && new Date(`${ride.date}T00:00:00`) >= today)
    .sort((a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime());
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

function createLocalStopId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `stop-${crypto.randomUUID()}`;
  }

  return `stop-${Date.now()}`;
}

function createLocalRideId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `new-ride-${crypto.randomUUID()}`;
  }

  return `new-ride-${Date.now()}`;
}
