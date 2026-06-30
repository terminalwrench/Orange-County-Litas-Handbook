import type { RideWeather } from "../../types";
import { isWithinCurrentWeek } from "../../utils/date";
import { DashboardCard } from "../ui/DashboardCard";
import { Icon } from "../ui/Icon";

interface RideWeatherCardProps {
  weather: RideWeather | null;
  referenceDate: string;
}

export function RideWeatherCard({ weather, referenceDate }: RideWeatherCardProps) {
  const isAvailable = weather ? weather.isForecastAvailable && isWithinCurrentWeek(weather.eventDate, referenceDate) : false;

  return (
    <DashboardCard className="weather-card" ariaLabel="Ride weather">
      <h2>{weather?.label ?? "Ride Weather"}</h2>
      {isAvailable && weather ? (
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
      ) : (
        <p className="weather-card__placeholder">Ride forecast will automatically appear during event week.</p>
      )}
    </DashboardCard>
  );
}
