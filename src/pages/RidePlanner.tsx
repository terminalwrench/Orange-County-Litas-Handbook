import { useState, type FormEvent } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { DateInput, SelectInput, Textarea, TextInput, TimeInput } from "../components/ui/inputs";
import type { EventRecord, RideRecord } from "../types";
import { getUpcomingRides, type RideSaveInput } from "../services/ridesService";
import type { PersistenceResult } from "../services/persistence";

interface RidePlannerProps {
  eventRecords: EventRecord[];
  rideRecords: RideRecord[];
  isLoading: boolean;
  isPersistenceConfigured: boolean;
  onSaveRide: (input: RideSaveInput, previousId?: string) => Promise<PersistenceResult<RideRecord>>;
}

interface RideFormState {
  id?: string;
  title: string;
  date: string;
  time: string;
  difficulty: string;
  meetup: string;
  destination: string;
  mileage: string;
  duration: string;
  notes: string;
}

const emptyRideForm: RideFormState = {
  title: "",
  date: "",
  time: "",
  difficulty: "Beginner Friendly",
  meetup: "",
  destination: "",
  mileage: "",
  duration: "",
  notes: ""
};

export function RidePlanner({ eventRecords, rideRecords, isLoading, isPersistenceConfigured, onSaveRide }: RidePlannerProps) {
  const upcomingRideEvents = getUpcomingRides(eventRecords);
  const upcomingSavedRides = getUpcomingSavedRides(rideRecords);
  const nextRide = upcomingRideEvents[0] ?? null;
  const nextSavedRide = upcomingSavedRides[0] ?? null;
  const [selectedRideId, setSelectedRideId] = useState<string | undefined>();
  const [formState, setFormState] = useState<RideFormState>(emptyRideForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  function updateForm(field: keyof RideFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleSelectRide(ride: RideRecord) {
    setSelectedRideId(ride.id);
    setFormState({
      id: ride.id,
      title: ride.title,
      date: ride.date,
      time: ride.time ?? "",
      difficulty: ride.difficulty,
      meetup: ride.meetup,
      destination: ride.destination,
      mileage: ride.mileage,
      duration: ride.duration,
      notes: ride.notes
    });
    setSaveMessage("");
    setSaveError("");
  }

  function handleNewRide() {
    setSelectedRideId(undefined);
    setFormState(emptyRideForm);
    setSaveMessage("");
    setSaveError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.title.trim()) {
      setSaveError("Ride name is required.");
      setSaveMessage("");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const result = await onSaveRide({
        id: selectedRideId,
        title: formState.title.trim(),
        date: formState.date,
        time: formState.time,
        meetup: formState.meetup.trim(),
        destination: formState.destination.trim(),
        mileage: formState.mileage.trim(),
        duration: formState.duration.trim(),
        difficulty: formState.difficulty,
        notes: formState.notes.trim()
      }, selectedRideId);

      setSelectedRideId(result.data.id);
      setFormState({
        id: result.data.id,
        title: result.data.title,
        date: result.data.date,
        time: result.data.time ?? "",
        difficulty: result.data.difficulty,
        meetup: result.data.meetup,
        destination: result.data.destination,
        mileage: result.data.mileage,
        duration: result.data.duration,
        notes: result.data.notes
      });
      setSaveMessage(result.source === "supabase" ? "Ride saved to Supabase." : "Ride saved locally for this session.");
    } catch (error) {
      console.warn("[rides] Ride save failed.", error);
      setSaveError("Ride could not be saved. Try again after checking the connection.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageContainer>
      <div className="page-title">
        <span>Ride Planner</span>
        <h1>Plan rides without overbuilding it</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Ride List" />
          <div className="record-list">
            {isLoading ? (
              <EmptyState title="Loading rides" message="Checking the configured ride source." />
            ) : upcomingRideEvents.length > 0 || upcomingSavedRides.length > 0 ? (
              <>
                {upcomingRideEvents.map((ride) => (
                  <article className="record-row" key={ride.id}>
                    <span>
                      <strong>{ride.title}</strong>
                      <em>{ride.startDate} · {ride.location}</em>
                    </span>
                    <StatusChip label={ride.status} tone={ride.status === "Planning" ? "warning" : "success"} />
                  </article>
                ))}
                {upcomingSavedRides.map((ride) => (
                  <article className={ride.id === selectedRideId ? "record-row record-row--selected" : "record-row"} key={ride.id}>
                    <span>
                      <strong>{ride.title}</strong>
                      <em>{ride.date} · {ride.destination}</em>
                    </span>
                    <StatusChip label={ride.difficulty} tone="accent" />
                    <Button type="button" variant="ghost" onClick={() => handleSelectRide(ride)}>
                      Edit
                    </Button>
                  </article>
                ))}
              </>
            ) : (
              <EmptyState title="No rides yet" message="Saved rides and ride events will appear here." />
            )}
          </div>
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Upcoming Ride" />
          {nextRide ? (
            <div className="detail-card">
              <h2>{nextRide.title}</h2>
              <p>Meetup: {nextRide.location}</p>
              <p>Date: {nextRide.startDate} at {nextRide.time}</p>
              <p>Status: {nextRide.status}</p>
              <p>{nextRide.notes}</p>
            </div>
          ) : nextSavedRide ? (
            <div className="detail-card">
              <h2>{nextSavedRide.title}</h2>
              <p>Meetup: {nextSavedRide.meetup || "TBD"}</p>
              <p>Date: {nextSavedRide.date || "TBD"}</p>
              <p>Difficulty: {nextSavedRide.difficulty}</p>
              <p>{nextSavedRide.notes}</p>
            </div>
          ) : (
            <EmptyState title="No upcoming branch ride" message="Ride events will appear here when they are added to the shared event source." />
          )}
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Ride Details" />
          <form className="form-grid" aria-label="Ride planning form" onSubmit={handleSubmit}>
            <FormField label="Ride Name" htmlFor="ride-name">
              <TextInput id="ride-name" placeholder="Ride name" value={formState.title} onChange={(event) => updateForm("title", event.target.value)} required />
            </FormField>
            <FormField label="Date" htmlFor="ride-date">
              <DateInput id="ride-date" value={formState.date} onChange={(event) => updateForm("date", event.target.value)} />
            </FormField>
            <FormField label="Meetup Time" htmlFor="ride-time">
              <TimeInput id="ride-time" value={formState.time} onChange={(event) => updateForm("time", event.target.value)} />
            </FormField>
            <FormField label="Difficulty" htmlFor="ride-difficulty">
              <SelectInput id="ride-difficulty" value={formState.difficulty} onChange={(event) => updateForm("difficulty", event.target.value)}>
                <option>Beginner Friendly</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </SelectInput>
            </FormField>
            <FormField label="Meetup Location" htmlFor="ride-meetup">
              <TextInput id="ride-meetup" placeholder="Start location" value={formState.meetup} onChange={(event) => updateForm("meetup", event.target.value)} />
            </FormField>
            <FormField label="Destination" htmlFor="ride-destination">
              <TextInput id="ride-destination" placeholder="Destination" value={formState.destination} onChange={(event) => updateForm("destination", event.target.value)} />
            </FormField>
            <FormField label="Mileage" htmlFor="ride-mileage">
              <TextInput id="ride-mileage" placeholder="Approx. mileage" value={formState.mileage} onChange={(event) => updateForm("mileage", event.target.value)} />
            </FormField>
            <FormField label="Duration" htmlFor="ride-duration">
              <TextInput id="ride-duration" placeholder="Approx. duration" value={formState.duration} onChange={(event) => updateForm("duration", event.target.value)} />
            </FormField>
            <FormField label="Ride Notes" htmlFor="ride-notes">
              <Textarea
                id="ride-notes"
                placeholder="Fuel, regroup, weather, parking, lead/sweep, or direct-arrival notes."
                value={formState.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
              />
            </FormField>
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save ride"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleNewRide}>New ride</Button>
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

function getUpcomingSavedRides(rides: RideRecord[]) {
  const today = new Date(new Date().toDateString());

  return [...rides]
    .filter((ride) => ride.date && new Date(`${ride.date}T00:00:00`) >= today)
    .sort((a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime());
}
