import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import type { BranchAsset, EventRecord, ExternalResource, ModuleId, OperationItem, OperationStatus, RideRecord } from "./types";
import { Events } from "./pages/Events";
import { Home } from "./pages/Home";
import { BranchAssets } from "./pages/BranchAssets";
import { Operations } from "./pages/Operations";
import { Reference } from "./pages/Reference";
import { RidePlanner } from "./pages/RidePlanner";
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
import {
  createOperationItem,
  deleteOperationItem,
  getOperationItems,
  loadOperationItems,
  updateOperationItem,
  updateOperationItemStatus,
  type OperationItemInput
} from "./services/operationsService";
import { getBranchAssets, loadBranchAssets } from "./services/branchAssetsService";
import { getPersistenceStatus } from "./services/persistence";
import { getRides, loadRideRecords, saveRideRecord, type RideSaveInput } from "./services/ridesService";
import { getUsefulLinks, loadUsefulLinks } from "./services/linksService";
import { getNavItems } from "./services/settingsService";

type TableDataSource = "static" | "supabase" | "fallback";
type EventDataSource = TableDataSource | "ics";
const initialPersistenceStatus = getPersistenceStatus();

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const [eventRecords, setEventRecords] = useState<EventRecord[]>(initialPersistenceStatus.isConfigured ? [] : getEvents());
  const [eventRecordsSource, setEventRecordsSource] = useState<EventDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [rideRecords, setRideRecords] = useState<RideRecord[]>(initialPersistenceStatus.isConfigured ? [] : getRides());
  const [rideRecordsSource, setRideRecordsSource] = useState<TableDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [operationItems, setOperationItems] = useState<OperationItem[]>(initialPersistenceStatus.isConfigured ? [] : getOperationItems());
  const [operationItemsSource, setOperationItemsSource] = useState<TableDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [branchAssets, setBranchAssets] = useState<BranchAsset[]>(initialPersistenceStatus.isConfigured ? [] : getBranchAssets());
  const [branchAssetsSource, setBranchAssetsSource] = useState<TableDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [usefulLinks, setUsefulLinks] = useState<ExternalResource[]>(initialPersistenceStatus.isConfigured ? [] : getUsefulLinks());
  const [usefulLinksSource, setUsefulLinksSource] = useState<TableDataSource>(initialPersistenceStatus.isConfigured ? "supabase" : "static");
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const eventDashboard = useMemo(() => buildEventDashboardData(eventRecords), [eventRecords]);
  const navItems = getNavItems();
  const persistenceStatus = getPersistenceStatus();
  const calendarImportAvailable = hasEventsIcsUrl();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadEventRecords(),
      loadRideRecords(),
      loadOperationItems(),
      loadBranchAssets(),
      loadUsefulLinks()
    ]).then(([eventResult, rideResult, operationResult, branchAssetResult, linksResult]) => {
      if (!cancelled) {
        setEventRecords(eventResult.events);
        setEventRecordsSource(eventResult.source);
        setRideRecords(rideResult.rides);
        setRideRecordsSource(rideResult.source);
        setOperationItems(operationResult.items);
        setOperationItemsSource(operationResult.source);
        setBranchAssets(branchAssetResult.assets);
        setBranchAssetsSource(branchAssetResult.source);
        setUsefulLinks(linksResult.links);
        setUsefulLinksSource(linksResult.source);
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

  async function handleCreateOperationItem(input: OperationItemInput) {
    const result = await createOperationItem(input);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setOperationItems((current) => upsertById(current, result.data));
    }
    if (result.source === "supabase") setOperationItemsSource("supabase");
    return result;
  }

  async function handleSaveEvent(input: EventSaveInput) {
    const result = await saveEventRecord(input);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setEventRecords((current) => upsertById(current, result.data, input.id));
    }
    if (result.source === "supabase") setEventRecordsSource("supabase");
    return result;
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

  async function handleUpdateOperationItem(input: OperationItemInput) {
    const result = await updateOperationItem(input);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setOperationItems((current) => upsertById(current, result.data, input.id));
    }
    if (result.source === "supabase") setOperationItemsSource("supabase");
    return result;
  }

  async function handleUpdateOperationStatus(item: OperationItem, status: OperationStatus) {
    const result = await updateOperationItemStatus(item, status);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setOperationItems((current) => upsertById(current, result.data, item.id));
    }
    if (result.source === "supabase") setOperationItemsSource("supabase");
    return result;
  }

  async function handleDeleteOperationItem(item: OperationItem) {
    const result = await deleteOperationItem(item);
    if (result.source === "supabase" || !persistenceStatus.isConfigured) {
      setOperationItems((current) => current.filter((record) => record.id !== item.id));
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
            operationItems={operationItems}
            operationItemsSource={operationItemsSource}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
            onCreateOperationItem={handleCreateOperationItem}
            onUpdateOperationItem={handleUpdateOperationItem}
            onUpdateOperationStatus={handleUpdateOperationStatus}
            onDeleteOperationItem={handleDeleteOperationItem}
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
