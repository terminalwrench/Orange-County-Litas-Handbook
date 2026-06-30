import type { CountdownStatus } from "../../types";
import { Icon } from "../ui/Icon";

interface SidebarCountdownProps {
  countdown: CountdownStatus;
}

export function SidebarCountdown({ countdown }: SidebarCountdownProps) {
  return (
    <aside className="sidebar-countdown" aria-label={countdown.ariaLabel}>
      <Icon name="calendar" />
      <span>
        <em>Next Event</em>
        {countdown.hasEvent ? <strong>{countdown.eventTitle}</strong> : null}
        <b>{countdown.label}</b>
      </span>
    </aside>
  );
}
