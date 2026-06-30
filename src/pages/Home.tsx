import { upcomingBirthdays } from "../data/appData";
import type { DashboardEvent, RideWeather, UpcomingEvent } from "../types";
import { toDateValue } from "../utils/date";
import { BirthdaysCard } from "../components/dashboard/BirthdaysCard";
import { ChapterNotesPlaceholder } from "../components/dashboard/ChapterNotesPlaceholder";
import { NextEventCard } from "../components/dashboard/NextEventCard";
import { RideWeatherCard } from "../components/dashboard/RideWeatherCard";
import { UpcomingEventsCard } from "../components/dashboard/UpcomingEventsCard";
import { PageContainer } from "../components/layout/PageContainer";

const referenceDate = toDateValue(new Date());

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
      <ChapterNotesPlaceholder />
    </PageContainer>
  );
}
