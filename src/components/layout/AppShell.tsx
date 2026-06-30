import { useState, type ReactNode } from "react";
import type { ModuleId, NavItem } from "../../types";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  navItems: NavItem[];
  activeModule: ModuleId;
  onSelectModule: (moduleId: ModuleId) => void;
  children: ReactNode;
}

export function AppShell({ navItems, activeModule, onSelectModule, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleSelect(moduleId: ModuleId) {
    onSelectModule(moduleId);
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <Sidebar navItems={navItems} activeModule={activeModule} onSelect={handleSelect} isOpen={sidebarOpen} />
      <div className="app-shell__body">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
          onOpenCalendar={() => onSelectModule("events")}
        />
        {children}
      </div>
      {sidebarOpen ? <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} /> : null}
    </div>
  );
}
