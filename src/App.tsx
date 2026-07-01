import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import type { EventRecord, ModuleId } from "./types";
import { Events } from "./pages/Events";
import { Home } from "./pages/Home";
import { MediaCenter } from "./pages/MediaCenter";
import { Operations } from "./pages/Operations";
import { Reference } from "./pages/Reference";
import { RidePlanner } from "./pages/RidePlanner";
import { buildEventDashboardData, getEvents, loadEventRecords } from "./services/eventsService";
import { getNavItems } from "./services/settingsService";

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const [eventRecords, setEventRecords] = useState<EventRecord[]>(getEvents());
  const eventDashboard = useMemo(() => buildEventDashboardData(eventRecords), [eventRecords]);
  const navItems = getNavItems();

  useEffect(() => {
    let cancelled = false;

    loadEventRecords().then((result) => {
      if (!cancelled) {
        setEventRecords(result.events);
      }
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
        return <Events eventRecords={eventDashboard.eventRecords} />;
      case "operations":
        return <Operations />;
      case "ride-planner":
        return <RidePlanner eventRecords={eventDashboard.eventRecords} />;
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
