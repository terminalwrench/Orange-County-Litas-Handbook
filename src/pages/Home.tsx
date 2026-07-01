import type { DashboardEvent, RideWeather, UpcomingEvent } from "../types";
import { toDateValue } from "../utils/date";
import { BirthdaysCard } from "../components/dashboard/BirthdaysCard";
import { BranchNotesPlaceholder } from "../components/dashboard/BranchNotesPlaceholder";
import { NextEventCard } from "../components/dashboard/NextEventCard";
import { RideWeatherCard } from "../components/dashboard/RideWeatherCard";
import { UpcomingEventsCard } from "../components/dashboard/UpcomingEventsCard";
import { PageContainer } from "../components/layout/PageContainer";
import { getUpcomingBirthdays } from "../services/birthdaysService";

const referenceDate = toDateValue(new Date());
const upcomingBirthdays = getUpcomingBirthdays();

interface HomeProps {
  nextEvent: DashboardEvent | null;
  upcomingEvents: UpcomingEvent[];
  rideWeather: RideWeather | null;
}

export function Home({ nextEvent, upcomingEvents, rideWeather }: HomeProps) {
  return (
    <PageContainer className="home-page">
      <h1 className="sr-only">Orange County Litas Operations Center</h1>
      <NextEventCard event={nextEvent} />
      <div className="home-grid">
        <UpcomingEventsCard events={upcomingEvents} />
        <div className="home-grid__stack">
          <BirthdaysCard birthdays={upcomingBirthdays} />
          <RideWeatherCard weather={rideWeather} referenceDate={referenceDate} />
        </div>
      </div>
      <BranchNotesPlaceholder />
    </PageContainer>
  );
}
