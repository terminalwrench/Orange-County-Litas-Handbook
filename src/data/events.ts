import type { EventRecord } from "../types";

export const eventRecords: EventRecord[] = [
  {
    id: "2026-07-09",
    title: "Cooks Corner",
    date: "2026-07-09",
    startDate: "2026-07-09",
    endDate: "2026-07-09",
    time: "6:30 PM",
    location: "Cooks Corner",
    city: "Silverado Canyon, CA",
    description: "Venue, email, and flyer are prepared.",
    source: "fallback",
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
    startDate: "2026-07-25",
    endDate: "2026-07-25",
    time: "TBD",
    location: "TBD",
    city: "Orange County, CA",
    description: "Confirm route, meetup location, and lead/sweep plan.",
    source: "fallback",
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
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    time: "All Day",
    location: "Beach location TBD",
    city: "Orange County, CA",
    description: "Coordinate partner tags, parking details, and arrival window.",
    source: "fallback",
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
