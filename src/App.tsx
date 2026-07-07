import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import type { EventRecord, ModuleId, OperationItem, OperationStatus, RideRecord } from "./types";
import { Events } from "./pages/Events";
import { Home } from "./pages/Home";
import { MediaCenter } from "./pages/MediaCenter";
import { Operations } from "./pages/Operations";
import { Reference } from "./pages/Reference";
import { RidePlanner } from "./pages/RidePlanner";
import { buildEventDashboardData, getEvents, loadEventRecords, saveEventRecord, type EventSaveInput } from "./services/eventsService";
import { getOperationItems, loadOperationItems, updateOperationItemStatus } from "./services/operationsService";
import { getPersistenceStatus } from "./services/persistence";
import { getRides, loadRideRecords, saveRideRecord, type RideSaveInput } from "./services/ridesService";
import { getNavItems } from "./services/settingsService";

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const [eventRecords, setEventRecords] = useState<EventRecord[]>(getEvents());
  const [rideRecords, setRideRecords] = useState<RideRecord[]>(getRides());
  const [operationItems, setOperationItems] = useState<OperationItem[]>(getOperationItems());
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const eventDashboard = useMemo(() => buildEventDashboardData(eventRecords), [eventRecords]);
  const navItems = getNavItems();
  const persistenceStatus = getPersistenceStatus();

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadEventRecords(), loadRideRecords(), loadOperationItems()]).then(([eventResult, rideResult, operationResult]) => {
      if (!cancelled) {
        setEventRecords(eventResult.events);
        setRideRecords(rideResult.rides);
        setOperationItems(operationResult.items);
        setIsLoadingRecords(false);
      }
    }).catch((error) => {
      console.warn("[app] Unable to load persisted records. Using fallback data.", error);
      if (!cancelled) setIsLoadingRecords(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveEvent(input: EventSaveInput, previousId?: string) {
    const result = await saveEventRecord(input);
    setEventRecords((current) => upsertById(current, result.data, previousId));
    return result;
  }

  async function handleSaveRide(input: RideSaveInput, previousId?: string) {
    const result = await saveRideRecord(input);
    setRideRecords((current) => upsertById(current, result.data, previousId));
    return result;
  }

  async function handleUpdateOperationStatus(item: OperationItem, status: OperationStatus) {
    const result = await updateOperationItemStatus(item, status);
    setOperationItems((current) => upsertById(current, result.data, item.id));
    return result;
  }

  function renderActivePage() {
    switch (activeModule) {
      case "home":
        return (
          <Home
            nextEvent={eventDashboard.nextEvent}
            upcomingEvents={eventDashboard.upcomingEvents}
            rideWeather={eventDashboard.rideWeather}
          />
        );
      case "events":
        return (
          <Events
            eventRecords={eventDashboard.eventRecords}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
            onSaveEvent={handleSaveEvent}
          />
        );
      case "operations":
        return (
          <Operations
            eventRecords={eventDashboard.eventRecords}
            rideRecords={rideRecords}
            operationItems={operationItems}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
            onUpdateOperationStatus={handleUpdateOperationStatus}
          />
        );
      case "ride-planner":
        return (
          <RidePlanner
            eventRecords={eventDashboard.eventRecords}
            rideRecords={rideRecords}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
            onSaveRide={handleSaveRide}
          />
        );
      case "media":
        return <MediaCenter eventRecords={eventDashboard.eventRecords} />;
      case "reference":
        return <Reference />;
    }
  }

  return (
    <AppShell
      navItems={navItems}
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      sidebarCountdown={eventDashboard.sidebarCountdown}
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
