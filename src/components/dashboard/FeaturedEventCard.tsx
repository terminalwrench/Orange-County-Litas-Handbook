import type { FeaturedEvent } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { EmptyState } from "../ui/EmptyState";
import { SectionHeader } from "../ui/SectionHeader";

interface FeaturedEventCardProps {
  event: FeaturedEvent | null;
}

export function FeaturedEventCard({ event }: FeaturedEventCardProps) {
  return (
    <DashboardCard className="featured-event-card" ariaLabel="Featured event">
      <SectionHeader title="Featured Event" />
      {event ? (
        <div className="featured-event-card__content">
          <h3>{event.title}</h3>
          <p>{event.dateLabel}</p>
          {event.cityState ? <span>{event.cityState}</span> : null}
        </div>
      ) : (
        <EmptyState title="No major events scheduled." />
      )}
    </DashboardCard>
  );
}
