import type {
  Birthday,
  ChecklistGroup,
  CountdownStatus,
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

export const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "operations", label: "Operations", icon: "settings" },
  { id: "events", label: "Events", icon: "calendar" },
  { id: "ride-planner", label: "Ride Planner", icon: "route" },
  { id: "media", label: "Media Center", icon: "image" },
  { id: "reference", label: "Reference", icon: "book" }
];

export const sidebarCountdown: CountdownStatus = {
  days: 2,
  label: "until Chapter Ride"
};

export const nextEvent: DashboardEvent = {
  id: "2026-07-09-meetup",
  title: "Old World Meet & Greet",
  month: "Jul",
  day: "9",
  weekday: "Wed",
  time: "6:30 PM",
  dateLine: "Wednesday, Jul 9",
  venue: "Old World Biergarten",
  city: "Huntington Beach, CA",
  startsInDays: 2,
  category: "Meet & Greet",
  checklist: [
    { label: "Venue Confirmed", tone: "success" },
    { label: "Route Complete", tone: "success" },
    { label: "Flyer Posted", tone: "success" },
    { label: "Email Sent", tone: "success" }
  ]
};

export const upcomingEvents: UpcomingEvent[] = [
  { id: "ride-jul-25", title: "Chapter Ride", month: "Jul", day: "25", time: "TBD", type: "Ride" },
  { id: "mng-aug-5", title: "Meet & Greet", month: "Aug", day: "5", time: "TBD", type: "Meet & Greet" },
  { id: "beach-aug-15", title: "Litas Beach Day", month: "Aug", day: "15", time: "All Day", type: "Community" }
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
    title: "OC Litas Monthly Meetup",
    date: "2026-07-09",
    time: "6:30 PM",
    location: "Old World Biergarten",
    type: "Meet & Greet",
    status: "Ready",
    flyerStatus: "Posted",
    notes: "Venue, email, and flyer are prepared."
  },
  {
    id: "2026-07-25",
    title: "OC Litas Monthly Ride",
    date: "2026-07-25",
    time: "TBD",
    location: "TBD",
    type: "Ride",
    status: "Planning",
    flyerStatus: "Needed",
    notes: "Confirm route, meetup location, and lead/sweep plan."
  },
  {
    id: "2026-08-15",
    title: "Litas Beach Day",
    date: "2026-08-15",
    time: "All Day",
    location: "Beach location TBD",
    type: "Community",
    status: "Planning",
    flyerStatus: "Needed",
    notes: "Coordinate partner tags, parking details, and arrival window."
  }
];

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
