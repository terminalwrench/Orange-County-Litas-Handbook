import type { DashboardEvent } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { DateBadge } from "../ui/DateBadge";
import { Icon } from "../ui/Icon";
import { StatusChip } from "../ui/StatusChip";

interface NextEventCardProps {
  event: DashboardEvent;
}

export function NextEventCard({ event }: NextEventCardProps) {
  return (
    <DashboardCard className="next-event-card" ariaLabel="Next event">
      <h2>Next Event</h2>
      <div className="next-event-card__main">
        <DateBadge month={event.month} day={event.day} weekday={event.weekday} />
        <div className="next-event-card__details">
          <h3>{event.title}</h3>
          <p>
            <Icon name="clock" />
            <span>
              {event.time}, {event.dateLine}
            </span>
          </p>
          <p>
            <Icon name="pin" />
            <span>
              {event.venue}
              <em>{event.city}</em>
            </span>
          </p>
        </div>
        <div className="starts-in" aria-label={`Starts in ${event.startsInDays} days`}>
          <span>Starts in</span>
          <strong>{event.startsInDays}</strong>
          <em>Days</em>
        </div>
      </div>
      <div className="status-row" aria-label="Event status">
        {event.checklist.map((item) => (
          <StatusChip key={item.label} label={item.label} tone={item.tone} withIcon />
        ))}
      </div>
    </DashboardCard>
  );
}
