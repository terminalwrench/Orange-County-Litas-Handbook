import type {
  Birthday,
  ChecklistGroup,
  DashboardEvent,
  Deadline,
  EventRecord,
  MediaItem,
  NavItem,
  ReferenceSection,
  RideRecord,
  RideWeather,
  UpcomingEvent,
  VenueReference
} from "../types";
import { getCountdownDisplay, getSidebarCountdown, getUpcomingEventRecords } from "../utils/countdown";
import { parseDate } from "../utils/date";

export const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "operations", label: "Operations", icon: "settings" },
  { id: "events", label: "Events", icon: "calendar" },
  { id: "ride-planner", label: "Ride Planner", icon: "route" },
  { id: "media", label: "Media Center", icon: "image" },
  { id: "reference", label: "Reference", icon: "book" }
];

export const upcomingDeadlines: Deadline[] = [
  { id: "email-reminder", title: "Email reminder", date: "2026-07-08", dueLabel: "Tomorrow" },
  { id: "reservation", title: "Confirm reservation", date: "2026-07-08", dueLabel: "Jul 8" },
  { id: "route", title: "Finalize route", date: "2026-07-10", dueLabel: "Jul 10" },
  { id: "patches", title: "Order patches", date: "2026-07-11", dueLabel: "Jul 11" }
];

export const upcomingBirthdays: Birthday[] = [
  { id: "emily", name: "Emily", initials: "EM", dateLabel: "Jul 4" },
  { id: "rachel", name: "Rachel", initials: "RA", dateLabel: "Jul 8" },
  { id: "stephanie", name: "Stephanie", initials: "ST", dateLabel: "Jul 13" }
];

export const rideWeather: RideWeather = {
  eventDate: "2026-07-12",
  label: "Ride Weather (Sat, Jul 12)",
  temperature: "72°",
  condition: "Sunny",
  rain: "0%",
  wind: "18 mph",
  humidity: "64%"
};

export const operationsChecklist: ChecklistGroup[] = [
  {
    title: "Daily",
    items: [
      "Check chapter email or inquiry inbox.",
      "Review Instagram messages, comments, and tags.",
      "Respond to member questions or route them to the right leader.",
      "Confirm urgent venue, ride, weather, or partner updates."
    ]
  },
  {
    title: "Monthly",
    items: [
      "Review the next 30 to 60 days on the chapter calendar.",
      "Confirm event owners, venues, and planning status.",
      "Review ride readiness and lead/sweep needs.",
      "Update completed event, venue, ride, and media records."
    ]
  }
];

export const venueReferences: VenueReference[] = [
  { name: "Old World Biergarten", category: "Meet & Greet", lastVisited: "2026-07-09", note: "Known chapter meetup venue." },
  { name: "Cook's Corner", category: "Ride Stop", lastVisited: "2026-07-09", note: "Useful for ride destination planning." },
  { name: "4th Street Market", category: "Food", lastVisited: "2024-06-14", note: "Flexible food-hall style stop." }
];

export const eventRecords: EventRecord[] = [
  {
    id: "2026-07-09",
    title: "Old World Meet & Greet",
    date: "2026-07-09",
    time: "6:30 PM",
    location: "Old World Biergarten",
    city: "Huntington Beach, CA",
    type: "Meet & Greet",
    status: "Ready",
    flyerStatus: "Posted",
    notes: "Venue, email, and flyer are prepared.",
    checklist: [
      { label: "Venue Confirmed", tone: "success" },
      { label: "Route Complete", tone: "success" },
      { label: "Flyer Posted", tone: "success" },
      { label: "Email Sent", tone: "success" }
    ]
  },
  {
    id: "2026-07-25",
    title: "OC Litas Monthly Ride",
    date: "2026-07-25",
    time: "TBD",
    location: "TBD",
    city: "Orange County, CA",
    type: "Ride",
    status: "Planning",
    flyerStatus: "Needed",
    notes: "Confirm route, meetup location, and lead/sweep plan.",
    checklist: [
      { label: "Venue Needed", tone: "warning" },
      { label: "Route Needed", tone: "warning" },
      { label: "Flyer Needed", tone: "warning" },
      { label: "Email Needed", tone: "warning" }
    ]
  },
  {
    id: "2026-08-15",
    title: "Litas Beach Day",
    date: "2026-08-15",
    time: "All Day",
    location: "Beach location TBD",
    city: "Orange County, CA",
    type: "Community",
    status: "Planning",
    flyerStatus: "Needed",
    notes: "Coordinate partner tags, parking details, and arrival window.",
    checklist: [
      { label: "Venue Needed", tone: "warning" },
      { label: "Route TBD", tone: "neutral" },
      { label: "Flyer Needed", tone: "warning" },
      { label: "Email Needed", tone: "warning" }
    ]
  }
];

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short"
});

const dateLineFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric"
});

function getMonth(date: string) {
  return shortDateFormatter.format(parseDate(date)).split(" ")[0];
}

function getDay(date: string) {
  return String(parseDate(date).getDate());
}

function toDashboardEvent(event: EventRecord): DashboardEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    month: getMonth(event.date),
    day: getDay(event.date),
    weekday: weekdayFormatter.format(parseDate(event.date)),
    time: event.time,
    dateLine: dateLineFormatter.format(parseDate(event.date)),
    venue: event.location,
    city: event.city,
    countdown: getCountdownDisplay(event.date),
    checklist: event.checklist,
    category: event.type
  };
}

function toUpcomingEvent(event: EventRecord): UpcomingEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    month: getMonth(event.date),
    day: getDay(event.date),
    time: event.time,
    type: event.type
  };
}

const upcomingEventRecords = getUpcomingEventRecords(eventRecords);

export const nextEvent: DashboardEvent | null = upcomingEventRecords[0]
  ? toDashboardEvent(upcomingEventRecords[0])
  : null;

export const upcomingEvents: UpcomingEvent[] = upcomingEventRecords.slice(1, 4).map(toUpcomingEvent);

export const sidebarCountdown = getSidebarCountdown(eventRecords);

export const rideRecords: RideRecord[] = [
  {
    id: "chapter-ride-jul",
    title: "Chapter Ride",
    date: "2026-07-25",
    meetup: "TBD",
    destination: "TBD",
    mileage: "TBD",
    duration: "TBD",
    difficulty: "Intermediate",
    notes: "Confirm fuel, regroup, weather, and direct-arrival option."
  },
  {
    id: "beach-day",
    title: "Litas Beach Day Ride",
    date: "2026-08-15",
    meetup: "TBD",
    destination: "Beach location TBD",
    mileage: "Local",
    duration: "Flexible",
    difficulty: "Beginner Friendly",
    notes: "Confirm parking, sand exposure, crowds, and backup destination."
  }
];

export const mediaItems: MediaItem[] = [
  { id: "official-branding", title: "Official OC Litas Logo", type: "Brand Asset", status: "Available", location: "Media assets" },
  { id: "july-meetup-flyer", title: "July Meet & Greet Flyer", type: "Flyer", status: "Posted", location: "Event record" },
  { id: "chapter-ride-assets", title: "Chapter Ride Media", type: "Flyer / Photos", status: "Needs prep", location: "Future event folder" }
];

export const referenceSections: ReferenceSection[] = [
  {
    title: "Chapter Basics",
    description: "Local operating context, rider expectations, and current chapter references.",
    links: [
      { label: "New Rider Guide", detail: "What riders should know before joining an event." },
      { label: "Chapter Requirements", detail: "Global and local requirements to keep visible." }
    ]
  },
  {
    title: "Social & Media",
    description: "Concise reminders for public posts and partner tagging.",
    links: [
      { label: "Social Media Guidelines", detail: "Post dimensions, tags, credits, and proofing checklist." },
      { label: "Brand Standards", detail: "Use official logo files and avoid recreating brand assets." }
    ]
  },
  {
    title: "Operations Reference",
    description: "Helpful but non-daily guidance kept out of the main workflows.",
    links: [
      { label: "Credentials", detail: "Service usernames and secure password-manager notes." },
      { label: "Common Challenges", detail: "Known operational issues and suggested approaches." }
    ]
  }
];
