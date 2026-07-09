import type { UpcomingEvent } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { DateBadge } from "../ui/DateBadge";
import { EmptyState } from "../ui/EmptyState";

interface UpcomingEventsCardProps {
  events: UpcomingEvent[];
  onOpenEvents: () => void;
}

export function UpcomingEventsCard({ events, onOpenEvents }: UpcomingEventsCardProps) {
  return (
    <DashboardCard className="list-card" ariaLabel="Upcoming events">
      <div className="section-header">
        <h2>
          <button className="section-title-button" type="button" onClick={onOpenEvents}>
            Upcoming Events
          </button>
        </h2>
      </div>
      {events.length > 0 ? (
        <div className="event-list">
          {events.map((event) => (
            <article className="event-list__row" key={event.id}>
              <DateBadge month={event.month} day={event.day} dateTime={event.date} compact />
              <span>
                <strong>{event.title}</strong>
                {isMeaningfulEventValue(event.time) ? <em>{event.time}</em> : null}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No upcoming events." message="Events will appear here when they are added." />
      )}
    </DashboardCard>
  );
}

function isMeaningfulEventValue(value: string | undefined | null) {
  const normalized = value?.trim();
  if (!normalized) return false;

  return !["tbd", "n/a", "not provided", "none", "-", "—"].includes(normalized.toLowerCase());
}
