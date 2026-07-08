import type { Birthday, DashboardEvent, EventReadinessKey, RideWeather, UpcomingEvent } from "../types";
import { toDateValue } from "../utils/date";
import { BirthdaysCard } from "../components/dashboard/BirthdaysCard";
import { BranchNotesPlaceholder } from "../components/dashboard/BranchNotesPlaceholder";
import { NextEventCard } from "../components/dashboard/NextEventCard";
import { RideWeatherCard } from "../components/dashboard/RideWeatherCard";
import { UpcomingEventsCard } from "../components/dashboard/UpcomingEventsCard";
import { PageContainer } from "../components/layout/PageContainer";

const referenceDate = toDateValue(new Date());

interface HomeProps {
  nextEvent: DashboardEvent | null;
  upcomingEvents: UpcomingEvent[];
  birthdaysThisMonth: Birthday[];
  rideWeather: RideWeather | null;
  onOpenEvents: () => void;
  onToggleEventReadiness: (eventId: string, key: EventReadinessKey) => void;
}

export function Home({ nextEvent, upcomingEvents, birthdaysThisMonth, rideWeather, onOpenEvents, onToggleEventReadiness }: HomeProps) {
  return (
    <PageContainer className="home-page">
      <h1 className="sr-only">Orange County Litas Operations Center</h1>
      <NextEventCard event={nextEvent} onToggleReadiness={onToggleEventReadiness} />
      <div className="home-grid">
        <UpcomingEventsCard events={upcomingEvents} onOpenEvents={onOpenEvents} />
        <div className="home-grid__stack">
          <BirthdaysCard birthdays={birthdaysThisMonth} />
        </div>
      </div>
      <RideWeatherCard weather={rideWeather} referenceDate={referenceDate} />
      <BranchNotesPlaceholder />
    </PageContainer>
  );
}
