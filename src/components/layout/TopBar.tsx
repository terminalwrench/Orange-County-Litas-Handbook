import { IconButton } from "../ui/IconButton";

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenCalendar: () => void;
}

export function TopBar({ onToggleSidebar, onOpenCalendar }: TopBarProps) {
  return (
    <header className="topbar">
      <button className="sidebar-toggle" type="button" onClick={onToggleSidebar} aria-label="Toggle navigation">
        <span />
        <span />
      </button>
      <IconButton icon="calendar" label="Open Events" onClick={onOpenCalendar} />
    </header>
  );
}
