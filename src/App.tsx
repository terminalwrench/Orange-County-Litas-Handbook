import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import type { EventRecord, ExternalResource, MediaItem, ModuleId, OperationItem, RideRecord } from "./types";
import { Events } from "./pages/Events";
import { Home } from "./pages/Home";
import { MediaCenter } from "./pages/MediaCenter";
import { Operations } from "./pages/Operations";
import { Reference } from "./pages/Reference";
import { RidePlanner } from "./pages/RidePlanner";
import { buildEventDashboardData, getEvents, loadEventRecords } from "./services/eventsService";
import { getOperationItems, loadOperationItems } from "./services/operationsService";
import { getMediaItems, loadMediaItems } from "./services/mediaService";
import { getPersistenceStatus } from "./services/persistence";
import { getRides, loadRideRecords } from "./services/ridesService";
import { getUsefulLinks, loadUsefulLinks } from "./services/linksService";
import { getNavItems } from "./services/settingsService";

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const [eventRecords, setEventRecords] = useState<EventRecord[]>(getEvents());
  const [rideRecords, setRideRecords] = useState<RideRecord[]>(getRides());
  const [operationItems, setOperationItems] = useState<OperationItem[]>(getOperationItems());
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(getMediaItems());
  const [usefulLinks, setUsefulLinks] = useState<ExternalResource[]>(getUsefulLinks());
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const eventDashboard = useMemo(() => buildEventDashboardData(eventRecords), [eventRecords]);
  const navItems = getNavItems();
  const persistenceStatus = getPersistenceStatus();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadEventRecords(),
      loadRideRecords(),
      loadOperationItems(),
      loadMediaItems(),
      loadUsefulLinks()
    ]).then(([eventResult, rideResult, operationResult, mediaResult, linksResult]) => {
      if (!cancelled) {
        setEventRecords(eventResult.events);
        setRideRecords(rideResult.rides);
        setOperationItems(operationResult.items);
        setMediaItems(mediaResult.media);
        setUsefulLinks(linksResult.links);
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
          />
        );
      case "operations":
        return (
          <Operations
            eventRecords={eventDashboard.eventRecords}
            rideRecords={rideRecords}
            operationItems={operationItems}
            mediaItems={mediaItems}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
          />
        );
      case "ride-planner":
        return (
          <RidePlanner
            eventRecords={eventDashboard.eventRecords}
            rideRecords={rideRecords}
            isLoading={isLoadingRecords}
            isPersistenceConfigured={persistenceStatus.isConfigured}
          />
        );
      case "media":
        return <MediaCenter eventRecords={eventDashboard.eventRecords} mediaItems={mediaItems} />;
      case "reference":
        return <Reference externalResources={usefulLinks} />;
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
