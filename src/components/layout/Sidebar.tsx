import type { ModuleId, NavItem } from "../../types";
import { assets } from "../../data/assets";
import { sidebarCountdown } from "../../data/appData";
import { SidebarCountdown } from "./SidebarCountdown";
import { SidebarNavItem } from "./SidebarNavItem";

interface SidebarProps {
  navItems: NavItem[];
  activeModule: ModuleId;
  onSelect: (moduleId: ModuleId) => void;
  isOpen: boolean;
}

export function Sidebar({ navItems, activeModule, onSelect, isOpen }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? "is-open" : ""}`} aria-label="Primary">
      <div className="sidebar__brand">
        <img src={assets.sidebarLogo} alt="Orange County Litas" />
      </div>
      <nav className="sidebar__nav" aria-label="Application modules">
        <ul>
          {navItems.map((item) => (
            <SidebarNavItem key={item.id} item={item} activeModule={activeModule} onSelect={onSelect} />
          ))}
        </ul>
      </nav>
      <SidebarCountdown countdown={sidebarCountdown} />
    </aside>
  );
}
