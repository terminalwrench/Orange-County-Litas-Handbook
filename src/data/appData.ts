import type {
  Birthday,
  ChecklistGroup,
  CountdownStatus,
  DashboardEvent,
  EventRecord,
  MediaItem,
  NavItem,
  ReferenceSection,
  RideRecord,
  RideWeather,
  UpcomingEvent,
  VenueReference
} from "../types";
import { getCountdownDisplay, getNextEvent, getSidebarCountdown, getUpcomingEvents } from "../utils/countdown";
import { isWithinCurrentWeek, parseDate, toDateValue } from "../utils/date";
import { assets } from "./assets";
import { eventRecords as staticEventRecords } from "./events";

export const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "operations", label: "Operations", icon: "settings" },
  { id: "events", label: "Events", icon: "calendar" },
  { id: "ride-planner", label: "Ride Planner", icon: "route" },
  { id: "media", label: "Media Center", icon: "image" },
  { id: "reference", label: "Reference", icon: "book" }
];

export const upcomingBirthdays: Birthday[] = [
  { id: "emily", name: "Emily", initials: "EM", dateLabel: "Jul 4" },
  { id: "veronica", name: "Rachel", initials: "RA", dateLabel: "Jul 8" },
  { id: "stephanie", name: "Stephanie", initials: "ST", dateLabel: "Jul 13" }
];

const rideWeatherForecast = {
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
      "Check branch email or inquiry inbox.",
      "Review Instagram messages, comments, and tags.",
      "Respond to member questions or route them to the right leader.",
      "Confirm urgent venue, ride, weather, or partner updates."
    ]
  },
  {
    title: "Monthly",
    items: [
      "Review the next 30 to 60 days on the branch calendar.",
      "Confirm event owners, venues, and planning status.",
      "Review ride readiness and lead/sweep needs.",
      "Update completed event, venue, ride, and media records."
    ]
  }
];

export const venueReferences: VenueReference[] = [
  { name: "Cooks Corner", category: "Meet & Greet", lastVisited: "2026-07-09", note: "Known branch meetup venue." },
  { name: "Cook's Corner", category: "Ride Stop", lastVisited: "2026-07-09", note: "Useful for ride destination planning." },
  { name: "4th Street Market", category: "Food", lastVisited: "2024-06-14", note: "Flexible food-hall style stop." }
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

function toDashboardEvent(event: EventRecord, today = new Date()): DashboardEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.startDate,
    month: getMonth(event.startDate),
    day: getDay(event.startDate),
    weekday: weekdayFormatter.format(parseDate(event.startDate)),
    time: event.time,
    dateLine: dateLineFormatter.format(parseDate(event.startDate)),
    venue: event.location,
    city: event.city,
    countdown: getCountdownDisplay(event.startDate, today),
    checklist: event.checklist,
    category: event.type
  };
}

function toUpcomingEvent(event: EventRecord): UpcomingEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.startDate,
    month: getMonth(event.startDate),
    day: getDay(event.startDate),
    time: event.time,
    type: event.type
  };
}

function isRideEvent(event: EventRecord) {
  return `${event.title} ${event.type}`.toLowerCase().includes("ride");
}

function toRideWeather(event: EventRecord | null, today = new Date()): RideWeather | null {
  if (!event) return null;

  return {
    eventDate: event.startDate,
    label: `Ride Weather (${dateLineFormatter.format(parseDate(event.startDate))})`,
    isForecastAvailable: isWithinCurrentWeek(event.startDate, toDateValue(today)),
    ...rideWeatherForecast
  };
}

export interface EventDashboardData {
  eventRecords: EventRecord[];
  nextEvent: DashboardEvent | null;
  upcomingEvents: UpcomingEvent[];
  sidebarCountdown: CountdownStatus;
  rideWeather: RideWeather | null;
}

export function buildEventDashboardData(
  records: EventRecord[],
  today = new Date()
): EventDashboardData {
  const upcomingEventRecords = getUpcomingEvents(records, today);
  const nextEventRecord = getNextEvent(records, today);
  const nextRideRecord = upcomingEventRecords.find(isRideEvent) ?? null;

  return {
    eventRecords: records,
    nextEvent: nextEventRecord ? toDashboardEvent(nextEventRecord, today) : null,
    upcomingEvents: upcomingEventRecords.slice(1, 4).map(toUpcomingEvent),
    sidebarCountdown: getSidebarCountdown(nextEventRecord, today),
    rideWeather: toRideWeather(nextRideRecord, today)
  };
}

const fallbackEventDashboard = buildEventDashboardData(staticEventRecords);

export const nextEvent = fallbackEventDashboard.nextEvent;

export const upcomingEvents = fallbackEventDashboard.upcomingEvents;

export const sidebarCountdown = fallbackEventDashboard.sidebarCountdown;

export const rideRecords: RideRecord[] = [
  {
    id: "branch-ride-jul",
    title: "Branch Ride",
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
  {
    id: "official-branding-full-white",
    title: "Official OC Litas Full White Logo",
    type: "logo",
    status: "Available",
    url: assets.logos.fullWhite
  },
  {
    id: "official-branding-white-fill",
    title: "Official OC Litas White Fill Logo",
    type: "logo",
    status: "Available",
    url: assets.logos.whiteFill
  },
  {
    id: "official-branding-script",
    title: "Official Litas Script Logo",
    type: "logo",
    status: "Available",
    url: assets.logos.scriptWhite
  },
  {
    id: "july-meetup-flyer",
    title: "July Meet & Greet Flyer",
    type: "flyer",
    relatedEventId: "2026-07-09",
    date: "2026-07-09",
    status: "Posted"
  },
  {
    id: "branch-ride-assets",
    title: "Branch Ride Media",
    type: "photo album",
    relatedEventId: "2026-07-25",
    date: "2026-07-25",
    status: "Needs prep"
  }
];

export const referenceSections: ReferenceSection[] = [
  {
    id: "branch-basics",
    title: "Branch Basics",
    description: "Local operating context, rider expectations, and current branch references.",
    items: [
      {
        id: "new-rider-guide",
        label: "New Rider Guide",
        detail: "What riders should know before joining an event.",
        content: [
          "Review event requirements before attending rides or meetups.",
          "Ask leadership about ride difficulty, timing, and required gear before joining a new route.",
          "Use the Events and Ride Planner modules for current event-specific details."
        ]
      },
      {
        id: "branch-requirements",
        label: "Branch Requirements",
        detail: "Global and local requirements to keep visible.",
        content: [
          "Keep local operating decisions aligned with The Litas requirements.",
          "Use official branch assets and current event records when communicating publicly.",
          "Escalate unclear policy questions to leadership before publishing or announcing."
        ]
      }
    ]
  },
  {
    id: "event-planning",
    title: "Event Planning",
    description: "Quick operating reminders for building and checking branch events.",
    items: [
      {
        id: "event-check",
        label: "Before Announcing",
        detail: "Confirm the core event facts before posting.",
        content: [
          "Verify date, time, venue, address, and attendance expectations.",
          "Confirm flyer status, email status, and any partner tags.",
          "Use the Events module as the working source for event records."
        ]
      },
      {
        id: "venue-check",
        label: "Venue Readiness",
        detail: "Check the practical details leadership usually needs.",
        content: [
          "Confirm parking, capacity, restrooms, food or drink availability, and reservation needs.",
          "Use Operations for venue/contact references and recurring prep notes."
        ]
      }
    ]
  },
  {
    id: "ride-planning",
    title: "Ride Planning",
    description: "Ride lead reminders for practical planning without adding map complexity.",
    items: [
      {
        id: "route-check",
        label: "Route Readiness",
        detail: "Confirm the ride can be safely communicated.",
        content: [
          "Check meetup location, destination, difficulty, mileage, timing, fuel, and regroup needs.",
          "Confirm weather and direct-arrival options before public reminders.",
          "Use Ride Planner for current ride details."
        ]
      }
    ]
  },
  {
    id: "media-flyers",
    title: "Media & Flyer Guidelines",
    description: "Concise reminders for public-facing media and event assets.",
    items: [
      {
        id: "social-media-guidelines",
        label: "Posting Checklist",
        detail: "Proofing reminders before posting public content.",
        content: [
          "Verify date, location, rider requirements, photographer credit, partner tags, and hashtags.",
          "Check readability and accessibility before publishing.",
          "Keep final flyers and photos tied to their event record."
        ]
      },
      {
        id: "brand-standards",
        label: "Brand Standards",
        detail: "Use official logo files and avoid recreating brand assets.",
        content: [
          "Use official source assets from the Media Center.",
          "Do not redraw, recolor, or recreate branch logo files.",
          "Keep final exported assets organized with the related event or media record."
        ]
      }
    ]
  },
  {
    id: "templates",
    title: "Templates",
    description: "Reusable lightweight prompts for repeat branch work.",
    items: [
      {
        id: "event-template",
        label: "Event Planning Template",
        detail: "Use this structure when drafting a new event.",
        content: [
          "Confirm date, time, venue, address, event type, flyer status, and communication status.",
          "Add route or parking notes when they affect attendance.",
          "Keep final notes with the event record."
        ]
      }
    ]
  },
  {
    id: "archive",
    title: "Archive (future)",
    description: "A future home for archive practices once the branch archive source is configured.",
    items: [
      {
        id: "archive-source",
        label: "Archive Source",
        detail: "Not configured yet.",
        content: [],
        disabled: true
      }
    ]
  }
];
