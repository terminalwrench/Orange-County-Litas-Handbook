export type ModuleId = "home" | "operations" | "events" | "ride-planner" | "media" | "reference";

export type IconName =
  | "home"
  | "settings"
  | "calendar"
  | "route"
  | "image"
  | "book"
  | "clock"
  | "pin"
  | "check"
  | "arrow"
  | "sun"
  | "plus"
  | "file"
  | "bike"
  | "map"
  | "mail"
  | "link"
  | "box";

export interface NavItem {
  id: ModuleId;
  label: string;
  icon: IconName;
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

export type StatusTone = "success" | "warning" | "neutral" | "accent";

export interface StatusItem {
  label: string;
  tone: StatusTone;
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

export interface Deadline {
  id: string;
  title: string;
  date: string;
  dueLabel: string;
}

export interface Birthday {
  id: string;
  name: string;
  initials: string;
  dateLabel: string;
}

export interface RideWeather {
  eventDate: string;
  label: string;
  temperature: string;
  condition: string;
  rain: string;
  wind: string;
  humidity: string;
}

export interface ChecklistGroup {
  title: string;
  items: string[];
}

export interface VenueReference {
  name: string;
  category: string;
  lastVisited: string;
  note: string;
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
  source: "fallback" | "ics";
  type: string;
  status: string;
  flyerStatus: string;
  notes: string;
  checklist: StatusItem[];
}

export interface RideRecord {
  id: string;
  title: string;
  date: string;
  meetup: string;
  destination: string;
  mileage: string;
  duration: string;
  difficulty: string;
  notes: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: string;
  status: string;
  location: string;
}

export interface ReferenceSection {
  title: string;
  description: string;
  links: Array<{ label: string; detail: string }>;
}
