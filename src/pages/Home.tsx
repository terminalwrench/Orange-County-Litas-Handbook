import {
  nextEvent,
  rideWeather,
  upcomingBirthdays,
  upcomingDeadlines,
  upcomingEvents
} from "../data/appData";
import { filterDeadlinesWithinDays } from "../utils/date";
import { BirthdaysCard } from "../components/dashboard/BirthdaysCard";
import { ChapterNotesPlaceholder } from "../components/dashboard/ChapterNotesPlaceholder";
import { DeadlinesCard } from "../components/dashboard/DeadlinesCard";
import { NextEventCard } from "../components/dashboard/NextEventCard";
import { RideWeatherCard } from "../components/dashboard/RideWeatherCard";
import { UpcomingEventsCard } from "../components/dashboard/UpcomingEventsCard";
import { PageContainer } from "../components/layout/PageContainer";

const referenceDate = "2026-07-07";

export function Home() {
  return (
    <PageContainer className="home-page">
      <h1 className="sr-only">Orange County Litas Operations Center</h1>
      <NextEventCard event={nextEvent} />
      <div className="home-grid">
        <UpcomingEventsCard events={upcomingEvents} />
        <DeadlinesCard deadlines={filterDeadlinesWithinDays(upcomingDeadlines, referenceDate, 5)} />
        <div className="home-grid__stack">
          <BirthdaysCard birthdays={upcomingBirthdays} />
          <RideWeatherCard weather={rideWeather} referenceDate={referenceDate} />
        </div>
      </div>
      <ChapterNotesPlaceholder />
    </PageContainer>
  );
}
