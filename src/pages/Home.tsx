import type { Birthday, DashboardEvent, EventReadinessKey, FeaturedEvent, RideWeather, UpcomingEvent } from "../types";
import { toDateValue } from "../utils/date";
import { BirthdaysCard } from "../components/dashboard/BirthdaysCard";
import { BranchNotesPlaceholder } from "../components/dashboard/BranchNotesPlaceholder";
import { FeaturedEventCard } from "../components/dashboard/FeaturedEventCard";
import { NextEventCard } from "../components/dashboard/NextEventCard";
import { RideWeatherCard } from "../components/dashboard/RideWeatherCard";
import { UpcomingEventsCard } from "../components/dashboard/UpcomingEventsCard";
import { PageContainer } from "../components/layout/PageContainer";

const referenceDate = toDateValue(new Date());

interface HomeProps {
  nextEvent: DashboardEvent | null;
  upcomingEvents: UpcomingEvent[];
  featuredEvent: FeaturedEvent | null;
  birthdaysThisMonth: Birthday[];
  rideWeather: RideWeather | null;
  onOpenEvents: () => void;
  onToggleEventReadiness: (eventId: string, key: EventReadinessKey) => void;
}

export function Home({ nextEvent, upcomingEvents, featuredEvent, birthdaysThisMonth, rideWeather, onOpenEvents, onToggleEventReadiness }: HomeProps) {
  return (
    <PageContainer className="home-page">
      <h1 className="sr-only">Orange County Litas Operations Center</h1>
      <NextEventCard event={nextEvent} onToggleReadiness={onToggleEventReadiness} />
      <div className="home-grid">
        <div className="home-grid__main">
          <UpcomingEventsCard events={upcomingEvents} onOpenEvents={onOpenEvents} />
          <FeaturedEventCard event={featuredEvent} />
        </div>
        <div className="home-grid__stack">
          <BirthdaysCard birthdays={birthdaysThisMonth} />
          <RideWeatherCard weather={rideWeather} referenceDate={referenceDate} />
        </div>
      </div>
      <BranchNotesPlaceholder />
    </PageContainer>
  );
}
