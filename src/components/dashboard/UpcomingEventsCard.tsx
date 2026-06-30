import type { UpcomingEvent } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { DateBadge } from "../ui/DateBadge";
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
            <DateBadge month={event.month} day={event.day} dateTime={event.date} compact />
            <span>
              <strong>{event.title}</strong>
              <em>{event.time}</em>
            </span>
          </article>
        ))}
      </div>
      <p className="card-note">Open the Events module for the complete event list.</p>
    </DashboardCard>
  );
}
