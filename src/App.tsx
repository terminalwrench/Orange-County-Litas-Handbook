import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import {
  buildCalendarDashboardData,
  fallbackEventRecords,
  navItems
} from "./data/appData";
import type { EventRecord, ModuleId } from "./types";
import { Events } from "./pages/Events";
import { Home } from "./pages/Home";
import { MediaCenter } from "./pages/MediaCenter";
import { Operations } from "./pages/Operations";
import { Reference } from "./pages/Reference";
import { RidePlanner } from "./pages/RidePlanner";
import { loadCalendarEvents } from "./services/calendarService";

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const [calendarEvents, setCalendarEvents] = useState<EventRecord[]>(fallbackEventRecords);
  const calendarDashboard = useMemo(() => buildCalendarDashboardData(calendarEvents), [calendarEvents]);

  useEffect(() => {
    let cancelled = false;

    loadCalendarEvents(fallbackEventRecords).then((result) => {
      if (!cancelled) {
        setCalendarEvents(result.events);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function renderActivePage() {
    switch (activeModule) {
      case "home":
        return <Home nextEvent={calendarDashboard.nextEvent} upcomingEvents={calendarDashboard.upcomingEvents} />;
      case "events":
        return <Events eventRecords={calendarDashboard.eventRecords} />;
      case "operations":
        return <Operations />;
      case "ride-planner":
        return <RidePlanner />;
      case "media":
        return <MediaCenter />;
      case "reference":
        return <Reference />;
    }
  }

  return (
    <AppShell
      navItems={navItems}
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      sidebarCountdown={calendarDashboard.sidebarCountdown}
    >
      {renderActivePage()}
    </AppShell>
  );
}
