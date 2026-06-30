import { useMemo, useState, type ComponentType } from "react";
import { AppShell } from "./components/layout/AppShell";
import { navItems } from "./data/appData";
import type { ModuleId } from "./types";
import { Events } from "./pages/Events";
import { Home } from "./pages/Home";
import { MediaCenter } from "./pages/MediaCenter";
import { Operations } from "./pages/Operations";
import { Reference } from "./pages/Reference";
import { RidePlanner } from "./pages/RidePlanner";

const pageMap: Record<ModuleId, ComponentType> = {
  home: Home,
  operations: Operations,
  events: Events,
  "ride-planner": RidePlanner,
  media: MediaCenter,
  reference: Reference
};

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const ActivePage = useMemo(() => pageMap[activeModule], [activeModule]);

  return (
    <AppShell navItems={navItems} activeModule={activeModule} onSelectModule={setActiveModule}>
      <ActivePage />
    </AppShell>
  );
}
