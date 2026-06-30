import type { ModuleId, NavItem } from "../../types";
import { Icon } from "../ui/Icon";

interface SidebarNavItemProps {
  item: NavItem;
  activeModule: ModuleId;
  onSelect: (moduleId: ModuleId) => void;
}

export function SidebarNavItem({ item, activeModule, onSelect }: SidebarNavItemProps) {
  const isActive = item.id === activeModule;

  return (
    <li>
      <button
        className={`sidebar-nav-item ${isActive ? "is-active" : ""}`}
        type="button"
        aria-current={isActive ? "page" : undefined}
        onClick={() => onSelect(item.id)}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
      </button>
    </li>
  );
}
