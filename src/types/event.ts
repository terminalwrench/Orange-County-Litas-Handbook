export type StatusTone = "success" | "warning" | "neutral" | "accent";
export type EventReadinessKey = "venueConfirmed" | "routeComplete" | "flyerPosted" | "emailSent";

export interface StatusItem {
  key?: EventReadinessKey;
  label: string;
  tone: StatusTone;
  complete?: boolean;
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
  isReady: boolean;
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
  venueConfirmed?: boolean;
  routeComplete?: boolean;
  flyerPosted?: boolean;
  emailSent?: boolean;
  flyerUrl?: string;
  groupPhotoUrl?: string;
  routeImageUrl?: string;
  instagramUrl?: string;
  appleAlbumUrl?: string;
  notes: string;
  externalUid?: string;
  checklist: StatusItem[];
}
