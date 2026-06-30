import type { UpcomingEvent } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { DateBadge } from "../ui/DateBadge";
import { Icon } from "../ui/Icon";
import { SectionHeader } from "../ui/SectionHeader";

interface UpcomingEventsCardProps {
  events: UpcomingEvent[];
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  return (
    <DashboardCard className="list-card" ariaLabel="Upcoming events">
      <SectionHeader title="Upcoming Events" />
      <div className="event-list">
        {events.map((event) => (
          <article className="event-list__row" key={event.id}>
            <DateBadge month={event.month} day={event.day} compact />
            <span>
              <strong>{event.title}</strong>
              <em>{event.time}</em>
            </span>
          </article>
        ))}
      </div>
      <button className="text-link" type="button">
        View all events
        <Icon name="arrow" />
      </button>
    </DashboardCard>
  );
}
