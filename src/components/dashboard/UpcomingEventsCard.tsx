import type { UpcomingEvent } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { DateBadge } from "../ui/DateBadge";

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
      <div className="event-list">
        {events.map((event) => (
          <article className="event-list__row" key={event.id}>
            <DateBadge month={event.month} day={event.day} dateTime={event.date} compact />
            <span>
              <strong>{event.title}</strong>
              <em>{event.time}</em>
            </span>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}
