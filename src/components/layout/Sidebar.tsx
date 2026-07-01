import type { ModuleId, NavItem } from "../../types";
import type { CountdownStatus } from "../../types";
import { SidebarCountdown } from "./SidebarCountdown";
import { SidebarNavItem } from "./SidebarNavItem";
import { getSidebarLogo } from "../../services/settingsService";

interface SidebarProps {
  navItems: NavItem[];
  activeModule: ModuleId;
  onSelect: (moduleId: ModuleId) => void;
  isOpen: boolean;
  countdown: CountdownStatus;
}

export function Sidebar({ navItems, activeModule, onSelect, isOpen, countdown }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? "is-open" : ""}`} aria-label="Primary">
      <div className="sidebar__brand">
        <img src={getSidebarLogo()} alt="Orange County Litas" />
      </div>
      <nav className="sidebar__nav" aria-label="Application modules">
        <ul>
          {navItems.map((item) => (
            <SidebarNavItem key={item.id} item={item} activeModule={activeModule} onSelect={onSelect} />
          ))}
        </ul>
      </nav>
      <SidebarCountdown countdown={countdown} />
    </aside>
  );
}
