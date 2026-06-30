import type { CountdownStatus } from "../../types";
import { Icon } from "../ui/Icon";

interface SidebarCountdownProps {
  countdown: CountdownStatus;
}

export function SidebarCountdown({ countdown }: SidebarCountdownProps) {
  return (
    <aside className="sidebar-countdown" aria-label={`${countdown.days} days ${countdown.label}`}>
      <Icon name="calendar" />
      <span>
        <strong>{countdown.days} Days</strong>
        <em>{countdown.label}</em>
      </span>
    </aside>
  );
}
