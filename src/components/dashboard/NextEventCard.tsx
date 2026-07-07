import type { DashboardEvent, EventReadinessKey } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { DateBadge } from "../ui/DateBadge";
import { Icon } from "../ui/Icon";

interface NextEventCardProps {
  event: DashboardEvent | null;
  onToggleReadiness: (eventId: string, key: EventReadinessKey) => void;
}

export function NextEventCard({ event, onToggleReadiness }: NextEventCardProps) {
  if (!event) {
    return (
      <DashboardCard className="next-event-card" ariaLabel="Next event">
        <h2>Next Event</h2>
        <div className="empty-state" role="status">
          <strong>No upcoming events</strong>
          <span>Add the next event record when planning begins.</span>
        </div>
      </DashboardCard>
    );
  }

  const countdownIsWord = event.countdown.unit === "";

  return (
    <DashboardCard className="next-event-card" ariaLabel="Next event">
      <h2>Next Event</h2>
      <div className="next-event-card__main">
        <DateBadge month={event.month} day={event.day} weekday={event.weekday} dateTime={event.date} />
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
        <div className="starts-in" aria-label={event.countdown.ariaLabel}>
          <span>Starts in</span>
          <strong className={countdownIsWord ? "starts-in__word" : undefined}>{event.countdown.value}</strong>
          {event.countdown.unit ? <em>{event.countdown.unit}</em> : null}
        </div>
      </div>
      <div className="status-row" aria-label="Event status">
        {event.checklist.map((item) => (
          <button
            className={`status-chip status-chip--${item.tone} readiness-chip`}
            key={item.label}
            type="button"
            onClick={() => item.key ? onToggleReadiness(event.id, item.key) : undefined}
            aria-pressed={Boolean(item.complete)}
          >
            <Icon name="check" />
            {item.label}
          </button>
        ))}
      </div>
      {event.isReady ? <p className="ready-hint">All readiness items are complete. This event appears ready.</p> : null}
    </DashboardCard>
  );
}
