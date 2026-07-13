import { useEffect, useMemo, useState } from "react";
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
  const [selectedRideId, setSelectedRideId] = useState<string | undefined>();
  const selectedRide = ridePlans.find((ride) => ride.id === selectedRideId) ?? (selectedRideId ? undefined : ridePlans[0]);
  const [formState, setFormState] = useState<RidePlan | null>(selectedRide ?? null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setFormState(selectedRide ?? null);
    setSaveMessage("");
    setSaveError("");
  }, [selectedRide?.id]);

  function selectRide(ride: RidePlan) {
    setSelectedRideId(ride.id);
  }

  function startNewRide() {
    const nextRide = createBlankRidePlan();
    setSelectedRideId(nextRide.id);
    setFormState(nextRide);
    setSaveMessage("");
    setSaveError("");
  }

  function updateField(field: keyof RidePlan, value: string | boolean | RideStop[]) {
    setFormState((current) => current ? { ...current, [field]: value } : current);
  }

  function updateStop(stopId: string, field: keyof RideStop, value: string) {
    setFormState((current) => {
      if (!current) return current;

      return {
        ...current,
        stops: current.stops.map((stop) => stop.id === stopId ? { ...stop, [field]: value } : stop)
      };
    });
  }

  function addStop() {
    setFormState((current) => {
      if (!current) return current;

      return {
        ...current,
        stops: [
          ...current.stops,
          {
            id: createLocalStopId(),
            type: "Meetup",
            location: "",
            arrivalTime: "",
            notes: ""
          }
        ]
      };
    });
  }

  function removeStop(stopId: string) {
    setFormState((current) => current ? { ...current, stops: current.stops.filter((stop) => stop.id !== stopId) } : current);
  }

  function moveStop(stopId: string, direction: -1 | 1) {
    setFormState((current) => {
      if (!current) return current;

      const currentIndex = current.stops.findIndex((stop) => stop.id === stopId);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.stops.length) return current;

      const stops = [...current.stops];
      const [stop] = stops.splice(currentIndex, 1);
      stops.splice(nextIndex, 0, stop);

      return { ...current, stops };
    });
  }

  async function handleSaveRide() {
    if (!formState) return;

    if (!formState.title.trim() || !formState.date) {
      setSaveMessage("");
      setSaveError("Ride name and date are required.");
      return;
    }

    setSavingId(formState.id);
    setSaveMessage("");
    setSaveError("");

    try {
      const result = await onSaveRide(toRideSaveInput(formState));

      if (result.source === "fallback" && isPersistenceConfigured) {
        setSaveError("Ride could not be saved to the shared ride records.");
      } else {
        setSaveMessage(result.source === "supabase" ? "Ride plan saved." : "Saved locally for this session.");
        setFormState(fromSavedRide(result.data));
        setSelectedRideId(result.data.id);
      }
    } catch (error) {
      console.warn("[ride-planner] Unable to save ride.", error);
      setSaveError("Ride could not be saved. Try again in a moment.");
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
        setSelectedRideId(undefined);
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
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Ride Queue" action={<Button type="button" variant="secondary" onClick={startNewRide}>Add Ride</Button>} />
          {isLoading ? (
            <EmptyState title="Loading rides" message="Checking the shared ride records." />
          ) : ridePlans.length > 0 ? (
            <div className="record-list">
              {ridePlans.map((ride) => (
                <button
                  className={ride.id === selectedRide?.id ? "event-record-row record-row--selected" : "event-record-row"}
                  type="button"
                  key={ride.id}
                  onClick={() => selectRide(ride)}
                >
                  <DateBadge
                    month={getRideMonth(ride.date)}
                    day={getRideDay(ride.date)}
                    dateTime={ride.date}
                    compact
                  />
                  <span className="event-record-row__details">
                    <strong>{ride.title}</strong>
                    <em>{ride.date || "Date not set"} · {ride.startingLocation || "Starting location not set"}</em>
                  </span>
                  <span className="event-record-row__status">
                    <StatusChip label={ride.status} tone={getStatusTone(ride.status)} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No ride plans available." message="Ride plans will appear here when ride events or saved routes are available." />
          )}
          <p className="form-note">
            {getSourceNote(rideRecordsSource, isPersistenceConfigured)}
          </p>
        </DashboardCard>
        {formState ? (
          <>
            <DashboardCard>
              <SectionHeader
                title="Ride Overview"
                action={(
                  <Button type="button" variant="secondary" onClick={handleSaveRide} disabled={savingId === formState.id}>
                    {savingId === formState.id ? "Saving..." : "Save ride"}
                  </Button>
                )}
              />
              <div className="form-grid">
                <FormField label="Ride Leader" htmlFor="ride-leader">
                  <SelectInput id="ride-leader" value={formState.rideLeader} onChange={(event) => updateField("rideLeader", event.target.value)}>
                    <option value="">Blank</option>
                    {memberOptions.map((member) => <option key={member} value={member}>{member}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Ride Name" htmlFor="ride-name">
                  <TextInput id="ride-name" value={formState.title} onChange={(event) => updateField("title", event.target.value)} />
                </FormField>
                <FormField label="Date" htmlFor="ride-date">
                  <DateInput id="ride-date" value={formState.date} onChange={(event) => updateField("date", event.target.value)} />
                </FormField>
                <FormField label="Sweep" htmlFor="ride-sweep">
                  <SelectInput id="ride-sweep" value={formState.sweep} onChange={(event) => updateField("sweep", event.target.value)}>
                    <option value="">Blank</option>
                    {memberOptions.map((member) => <option key={member} value={member}>{member}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Difficulty" htmlFor="ride-difficulty">
                  <SelectInput id="ride-difficulty" value={formState.difficulty} onChange={(event) => updateField("difficulty", event.target.value)}>
                    {difficultyOptions.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Status" htmlFor="ride-status">
                  <SelectInput id="ride-status" value={formState.status} onChange={(event) => updateField("status", event.target.value)}>
                    {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Estimated Distance" htmlFor="ride-distance">
                  <TextInput id="ride-distance" type="number" min="0" inputMode="decimal" value={formState.estimatedDistance} onChange={(event) => updateField("estimatedDistance", event.target.value)} />
                </FormField>
                <FormField label="Estimated Ride Time" htmlFor="ride-duration">
                  <SelectInput id="ride-duration" value={formState.estimatedRideTime} onChange={(event) => updateField("estimatedRideTime", event.target.value)}>
                    {rideTimeOptions.map((duration) => <option key={duration} value={duration}>{duration}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Freeways" htmlFor="ride-freeways">
                  <SelectInput id="ride-freeways" value={formState.freeways ? "yes" : "no"} onChange={(event) => updateField("freeways", event.target.value === "yes")}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </SelectInput>
                </FormField>
                <FormField label="Notes" htmlFor="ride-notes">
                  <Textarea id="ride-notes" value={formState.notes} onChange={(event) => updateField("notes", event.target.value)} />
                </FormField>
              </div>
            </DashboardCard>
            <DashboardCard>
              <SectionHeader title="Route Plan" />
              <div className="form-grid">
                <FormField label="Starting Location" htmlFor="ride-starting-location">
                  <TextInput id="ride-starting-location" value={formState.startingLocation} onChange={(event) => updateField("startingLocation", event.target.value)} />
                </FormField>
                <FormField label="Meetup Time" htmlFor="ride-kickstands-up">
                  <TimeInput id="ride-kickstands-up" value={formState.kickstandsUp} onChange={(event) => updateField("kickstandsUp", event.target.value)} />
                </FormField>
                <FormField label="Primary Route Link" htmlFor="ride-primary-route">
                  <TextInput id="ride-primary-route" type="url" value={formState.primaryRouteLink} onChange={(event) => updateField("primaryRouteLink", event.target.value)} />
                </FormField>
                <FormField label="Alternative Route Link" htmlFor="ride-alternative-route">
                  <TextInput id="ride-alternative-route" type="url" value={formState.alternativeRouteLink} onChange={(event) => updateField("alternativeRouteLink", event.target.value)} />
                </FormField>
                <FormField label="Total Distance" htmlFor="ride-total-distance">
                  <TextInput id="ride-total-distance" type="number" min="0" inputMode="decimal" value={formState.totalDistance} onChange={(event) => updateField("totalDistance", event.target.value)} />
                </FormField>
                <FormField label="Estimated Ride Time" htmlFor="ride-route-duration">
                  <SelectInput id="ride-route-duration" value={formState.routeDuration} onChange={(event) => updateField("routeDuration", event.target.value)}>
                    <option value="">No override</option>
                    {rideTimeOptions.map((duration) => <option key={duration} value={duration}>{duration}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Destination" htmlFor="ride-destination">
                  <TextInput id="ride-destination" value={formState.destination} onChange={(event) => updateField("destination", event.target.value)} />
                </FormField>
              </div>
            </DashboardCard>
            <DashboardCard className="span-all">
              <SectionHeader title="Stops" action={<Button type="button" variant="secondary" onClick={addStop}>+ Add Stop</Button>} />
              {formState.stops.length > 0 ? (
                <div className="ride-stop-list">
                  {formState.stops.map((stop, index) => (
                    <article className="ride-stop-row" key={stop.id}>
                      <div className="form-grid">
                        <FormField label="Stop Type" htmlFor={`stop-type-${stop.id}`}>
                          <SelectInput id={`stop-type-${stop.id}`} value={stop.type} onChange={(event) => updateStop(stop.id, "type", event.target.value)}>
                            {stopTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                          </SelectInput>
                        </FormField>
                        <FormField label="Location" htmlFor={`stop-location-${stop.id}`}>
                          <TextInput id={`stop-location-${stop.id}`} value={stop.location} onChange={(event) => updateStop(stop.id, "location", event.target.value)} />
                        </FormField>
                        <FormField label="Arrival Time" htmlFor={`stop-arrival-${stop.id}`}>
                          <TimeInput id={`stop-arrival-${stop.id}`} value={stop.arrivalTime ?? ""} onChange={(event) => updateStop(stop.id, "arrivalTime", event.target.value)} />
                        </FormField>
                        <FormField label="Notes" htmlFor={`stop-notes-${stop.id}`}>
                          <TextInput id={`stop-notes-${stop.id}`} value={stop.notes ?? ""} onChange={(event) => updateStop(stop.id, "notes", event.target.value)} />
                        </FormField>
                      </div>
                      <div className="record-row__actions">
                        <Button type="button" variant="ghost" onClick={() => moveStop(stop.id, -1)} disabled={index === 0}>Up</Button>
                        <Button type="button" variant="ghost" onClick={() => moveStop(stop.id, 1)} disabled={index === formState.stops.length - 1}>Down</Button>
                        <Button type="button" variant="ghost" onClick={() => removeStop(stop.id)}>Remove</Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No stops added" message="Add gas, food, restroom, photo, meetup, scenic, or other ride stops." />
              )}
            </DashboardCard>
            <DashboardCard>
              <SectionHeader title="Ride Settings" />
              <div className="form-grid">
                <FormField label="Ride Type" htmlFor="ride-type">
                  <SelectInput id="ride-type" value={formState.rideType} onChange={(event) => updateField("rideType", event.target.value)}>
                    {rideTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Visibility" htmlFor="ride-visibility">
                  <SelectInput id="ride-visibility" value={formState.visibility} onChange={(event) => updateField("visibility", event.target.value)}>
                    {visibilityOptions.map((visibility) => <option key={visibility} value={visibility}>{visibility}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Weather Policy" htmlFor="ride-weather-policy">
                  <SelectInput id="ride-weather-policy" value={formState.weatherPolicy} onChange={(event) => updateField("weatherPolicy", event.target.value)}>
                    {weatherPolicyOptions.map((policy) => <option key={policy} value={policy}>{policy}</option>)}
                  </SelectInput>
                </FormField>
              </div>
            </DashboardCard>
            <DashboardCard>
              <SectionHeader title="Save Plan" />
              <div className="form-actions">
                <Button type="button" variant="primary" onClick={handleSaveRide} disabled={savingId === formState.id}>
                  {savingId === formState.id ? "Saving..." : "Save ride"}
                </Button>
                <Button type="button" variant="ghost" onClick={handleDeleteRide} disabled={!formState.recordId || savingId === formState.id}>
                  Delete ride
                </Button>
                <span className="form-note">
                  {isPersistenceConfigured ? "Changes save to the shared ride records." : "Changes are kept for this browser session."}
                </span>
              </div>
              {saveMessage ? <p className="form-status form-status--success">{saveMessage}</p> : null}
              {saveError ? <p className="form-status form-status--error">{saveError}</p> : null}
            </DashboardCard>
          </>
        ) : (
          <DashboardCard>
            <EmptyState title="No ride selected" message="Select a ride to build the working plan." />
          </DashboardCard>
        )}
      </div>
    </PageContainer>
  );
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
