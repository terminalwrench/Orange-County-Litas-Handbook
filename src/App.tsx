import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppShell } from "./components/layout/AppShell";
import type { BranchAsset, EventReadinessKey, EventRecord, ExternalResource, MemberRecord, MemberSaveInput, ModuleId, RideRecord } from "./types";
import { Events } from "./pages/Events";
import { Home } from "./pages/Home";
import { BranchAssets } from "./pages/BranchAssets";
import { Login } from "./pages/Login";
import { Operations } from "./pages/Operations";
import { Reference } from "./pages/Reference";
import { RidePlanner } from "./pages/RidePlanner";
import {
  getCurrentSession,
  isAuthConfigured,
  signInToPortal,
  signOutOfPortal,
  subscribeToAuthChanges
} from "./services/authService";
import { hasEventsIcsUrl } from "./services/calendarService";
import {
  buildEventDashboardData,
  deleteEventRecord,
  getEvents,
  importCalendarEventsFromIcs,
  loadEventRecords,
  saveEventRecord,
  type CalendarImportResult,
  type EventSaveInput
} from "./services/eventsService";
import { getBranchAssets, loadBranchAssets } from "./services/branchAssetsService";
import { getPersistenceStatus } from "./services/persistence";
import { getRides, loadRideRecords, saveRideRecord, type RideSaveInput } from "./services/ridesService";
import { getUsefulLinks, loadUsefulLinks } from "./services/linksService";
import { getNavItems } from "./services/settingsService";
import {
  deleteMemberRecord,
  getBirthdaysThisMonthFromMembers,
  loadMemberRecords,
  saveMemberRecord
} from "./services/birthdaysService";

type TableDataSource = "static" | "supabase" | "fallback";
type EventDataSource = TableDataSource | "ics";
const initialPersistenceStatus = getPersistenceStatus();

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [eventRecords, setEventRecords] = useState<EventRecord[]>(initialPersistenceStatus.isConfigured ? [] : getEvents());
  const [eventRecordsSource, setEventRecordsSource] = useState<EventDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [rideRecords, setRideRecords] = useState<RideRecord[]>(initialPersistenceStatus.isConfigured ? [] : getRides());
  const [rideRecordsSource, setRideRecordsSource] = useState<TableDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [branchAssets, setBranchAssets] = useState<BranchAsset[]>(initialPersistenceStatus.isConfigured ? [] : getBranchAssets());
  const [branchAssetsSource, setBranchAssetsSource] = useState<TableDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [usefulLinks, setUsefulLinks] = useState<ExternalResource[]>(initialPersistenceStatus.isConfigured ? [] : getUsefulLinks());
  const [usefulLinksSource, setUsefulLinksSource] = useState<TableDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [memberRecords, setMemberRecords] = useState<MemberRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const eventDashboard = useMemo(() => buildEventDashboardData(eventRecords), [eventRecords]);
  const birthdaysThisMonth = useMemo(() => getBirthdaysThisMonthFromMembers(memberRecords), [memberRecords]);
  const navItems = getNavItems();
  const persistenceStatus = getPersistenceStatus();
  const calendarImportAvailable = hasEventsIcsUrl();

  useEffect(() => {
    let cancelled = false;

    if (!isAuthConfigured()) {
      setIsAuthLoading(false);
      return () => {
        cancelled = true;
      };
    }

    getCurrentSession()
      .then((session) => {
        if (!cancelled) setAuthSession(session);
      })
      .catch((error) => {
        console.warn("[auth] Unable to restore Supabase session.", error);
        if (!cancelled) setAuthError("Unable to restore your session. Please sign in again.");
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false);
      });

    const subscription = subscribeToAuthChanges((session) => {
      if (!cancelled) {
        setAuthSession(session);
        setAuthError(null);
        setIsAuthLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authSession) {
      setIsLoadingRecords(false);
      return;
    }

    let cancelled = false;
    setIsLoadingRecords(true);

    Promise.all([
      loadEventRecords(),
      loadRideRecords(),
      loadBranchAssets(),
      loadUsefulLinks(),
      loadMemberRecords()
    ]).then(([eventResult, rideResult, branchAssetResult, linksResult, memberResult]) => {
      if (!cancelled) {
        setEventRecords(eventResult.events);
        setEventRecordsSource(eventResult.source);
        setRideRecords(rideResult.rides);
        setRideRecordsSource(rideResult.source);
        setBranchAssets(branchAssetResult.assets);
        setBranchAssetsSource(branchAssetResult.source);
        setUsefulLinks(linksResult.links);
        setUsefulLinksSource(linksResult.source);
        setMemberRecords(memberResult.members);
        setIsLoadingRecords(false);
      }
    }).catch((error) => {
      console.warn("[app] Unable to load persisted records. Using fallback data.", error);
      if (!cancelled) setIsLoadingRecords(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authSession]);

  async function handleLogin(email: string, password: string) {
    setAuthError(null);
    try {
      const session = await signInToPortal(email, password);
      setAuthSession(session);
    } catch (error) {
      console.warn("[auth] Sign in failed.", error);
      setAuthError("Sign in failed. Check the email and password, then try again.");
    }
  }

  async function handleLogout() {
    try {
      await signOutOfPortal();
    } catch (error) {
      console.warn("[auth] Sign out failed.", error);
    } finally {
      setAuthSession(null);
      setActiveModule("home");
      setEventRecords(initialPersistenceStatus.isConfigured ? [] : getEvents());
      setRideRecords(initialPersistenceStatus.isConfigured ? [] : getRides());
      setBranchAssets(initialPersistenceStatus.isConfigured ? [] : getBranchAssets());
      setUsefulLinks(initialPersistenceStatus.isConfigured ? [] : getUsefulLinks());
      setMemberRecords([]);
    }
  }

  async function handleSaveEvent(input: EventSaveInput) {
    const result = await saveEventRecord(input);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setEventRecords((current) => upsertById(current, result.data, input.id));
    }
    if (result.source === "supabase") setEventRecordsSource("supabase");
    return result;
  }

  async function handleToggleEventReadiness(eventId: string, key: EventReadinessKey) {
    const event = eventRecords.find((record) => record.id === eventId);
    if (!event) return;

    const result = await saveEventRecord({
      id: event.id,
      title: event.title,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      time: event.time,
      location: event.location,
      city: event.city,
      description: event.description,
      status: event.status,
      flyerStatus: key === "flyerPosted" && event.flyerPosted ? "Needed" : event.flyerStatus,
      rideDifficulty: event.rideDifficulty,
      venueConfirmed: key === "venueConfirmed" ? !event.venueConfirmed : event.venueConfirmed,
      routeComplete: key === "routeComplete" ? !event.routeComplete : event.routeComplete,
      flyerPosted: key === "flyerPosted" ? !event.flyerPosted : event.flyerPosted,
      emailSent: key === "emailSent" ? !event.emailSent : event.emailSent,
      flyerUrl: event.flyerUrl,
      groupPhotoUrl: event.groupPhotoUrl,
      routeImageUrl: event.routeImageUrl,
      instagramUrl: event.instagramUrl,
      appleAlbumUrl: event.appleAlbumUrl,
      notes: event.notes,
      externalUid: event.externalUid
    });

    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setEventRecords((current) => upsertById(current, result.data, event.id));
    }
    if (result.source === "supabase") setEventRecordsSource("supabase");
  }

  async function handleDeleteEvent(event: EventRecord) {
    const result = await deleteEventRecord(event);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setEventRecords((current) => current.filter((record) => record.id !== event.id));
    }
    return result;
  }

  async function handleImportCalendarEvents(): Promise<CalendarImportResult> {
    const result = await importCalendarEventsFromIcs();

    if (result.imported.length > 0) {
      setEventRecords((current) => {
        const nextRecords = [...current];

        for (const event of result.imported) {
          const index = nextRecords.findIndex(
            (record) => record.id === event.id || (event.externalUid && record.externalUid === event.externalUid)
          );

          if (index === -1) {
            nextRecords.push(event);
          }
        }

        return nextRecords;
      });
      setEventRecordsSource("supabase");
    }

    return result;
  }

  async function handleSaveRide(input: RideSaveInput) {
    const result = await saveRideRecord(input);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setRideRecords((current) => upsertById(current, result.data, input.id));
    }
    if (result.source === "supabase") setRideRecordsSource("supabase");
    return result;
  }

  async function handleSaveMember(input: MemberSaveInput) {
    const result = await saveMemberRecord(input);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setMemberRecords((current) => upsertById(current, result.data, input.id));
    }
    return result;
  }

  async function handleDeleteMember(member: MemberRecord) {
    const result = await deleteMemberRecord(member);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setMemberRecords((current) => current.filter((record) => record.id !== member.id));
    }
    return result;
  }

  function renderActivePage() {
    switch (activeModule) {
      case "home":
        return (
          <Home
            nextEvent={eventDashboard.nextEvent}
            upcomingEvents={eventDashboard.upcomingEvents}
            birthdaysThisMonth={birthdaysThisMonth}
            rideWeather={eventDashboard.rideWeather}
            onOpenEvents={() => setActiveModule("events")}
            onToggleEventReadiness={handleToggleEventReadiness}
          />
        );
      case "events":
        return (
          <Events
            eventRecords={eventDashboard.eventRecords}
            eventRecordsSource={eventRecordsSource}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
            isCalendarImportAvailable={calendarImportAvailable}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
            onImportCalendarEvents={handleImportCalendarEvents}
          />
        );
      case "operations":
        return (
          <Operations
            eventRecords={eventDashboard.eventRecords}
            memberRecords={memberRecords}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
          />
        );
      case "ride-planner":
        return (
          <RidePlanner
            eventRecords={eventDashboard.eventRecords}
            rideRecords={rideRecords}
            rideRecordsSource={rideRecordsSource}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
            onSaveRide={handleSaveRide}
          />
        );
      case "media":
        return <BranchAssets assets={branchAssets} assetsSource={branchAssetsSource} />;
      case "reference":
        return <Reference externalResources={usefulLinks} externalResourcesSource={usefulLinksSource} />;
    }
  }

  if (isAuthLoading || !authSession) {
    return (
      <Login
        isCheckingSession={isAuthLoading}
        isConfigured={isAuthConfigured()}
        error={authError}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <AppShell
      navItems={navItems}
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      sidebarCountdown={eventDashboard.sidebarCountdown}
      onLogout={handleLogout}
    >
      {renderActivePage()}
    </AppShell>
  );
}

function upsertById<T extends { id: string }>(records: T[], saved: T, previousId?: string) {
  const index = records.findIndex((record) => record.id === saved.id || record.id === previousId);
  if (index === -1) return [...records, saved];

  return records.map((record, recordIndex) => recordIndex === index ? saved : record);
}
