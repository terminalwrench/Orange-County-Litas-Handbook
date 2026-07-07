export type StatusTone = "success" | "warning" | "neutral" | "accent";

export interface StatusItem {
  label: string;
  tone: StatusTone;
}

export interface CountdownStatus {
  eventTitle: string;
  label: string;
  ariaLabel: string;
  hasEvent: boolean;
}

export interface CountdownDisplay {
  daysRemaining: number | null;
  label: string;
  value: string;
  unit: string;
  ariaLabel: string;
}

export interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  month: string;
  day: string;
  weekday: string;
  time: string;
  dateLine: string;
  venue: string;
  city: string;
  countdown: CountdownDisplay;
  checklist: StatusItem[];
  category: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  month: string;
  day: string;
  time: string;
  type: string;
}

export interface RideWeather {
  eventDate: string;
  label: string;
  isForecastAvailable: boolean;
  temperature: string;
  condition: string;
  rain: string;
  wind: string;
  humidity: string;
}

export interface EventRecord {
  id: string;
  title: string;
  date: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  city: string;
  description: string;
  source: "fallback" | "ics" | "supabase";
  type: string;
  status: string;
  flyerStatus: string;
  rideDifficulty?: string;
  notes: string;
  externalUid?: string;
  checklist: StatusItem[];
}
