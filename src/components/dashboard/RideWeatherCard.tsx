import type { RideWeather } from "../../types";
import { isWithinCurrentWeek } from "../../utils/date";
import { DashboardCard } from "../ui/DashboardCard";
import { Icon } from "../ui/Icon";

interface RideWeatherCardProps {
  weather: RideWeather | null;
  referenceDate: string;
}

export function RideWeatherCard({ weather, referenceDate }: RideWeatherCardProps) {
  if (!weather) return null;
  if (!isWithinCurrentWeek(weather.eventDate, referenceDate)) return null;

  return (
    <DashboardCard className="weather-card" ariaLabel="Ride weather">
      <h2>{weather.label}</h2>
      <div className="weather-card__content">
        <Icon name="sun" className="sun-icon" />
        <span className="temperature">
          <strong>{weather.temperature}</strong>
          <em>{weather.condition}</em>
        </span>
        <span>
          <strong>{weather.rain}</strong>
          <em>Rain</em>
        </span>
        <span>
          <strong>{weather.wind}</strong>
          <em>Wind</em>
        </span>
        <span>
          <strong>{weather.humidity}</strong>
          <em>Humidity</em>
        </span>
      </div>
    </DashboardCard>
  );
}
