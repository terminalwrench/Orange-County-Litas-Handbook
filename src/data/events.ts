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
    venueConfirmed: true,
    routeComplete: true,
    flyerPosted: true,
    emailSent: true,
    notes: "Venue, email, and flyer are prepared.",
    checklist: [
      { key: "venueConfirmed", label: "Venue Confirmed", tone: "success", complete: true },
      { key: "routeComplete", label: "Route Complete", tone: "success", complete: true },
      { key: "flyerPosted", label: "Flyer Posted", tone: "success", complete: true },
      { key: "emailSent", label: "Email Sent", tone: "success", complete: true }
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
    venueConfirmed: false,
    routeComplete: false,
    flyerPosted: false,
    emailSent: false,
    notes: "Confirm route, meetup location, and lead/sweep plan.",
    checklist: [
      { key: "venueConfirmed", label: "Venue Confirmed", tone: "warning", complete: false },
      { key: "routeComplete", label: "Route Complete", tone: "warning", complete: false },
      { key: "flyerPosted", label: "Flyer Posted", tone: "warning", complete: false },
      { key: "emailSent", label: "Email Sent", tone: "warning", complete: false }
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
    venueConfirmed: false,
    routeComplete: false,
    flyerPosted: false,
    emailSent: false,
    notes: "Coordinate partner tags, parking details, and arrival window.",
    checklist: [
      { key: "venueConfirmed", label: "Venue Confirmed", tone: "warning", complete: false },
      { key: "routeComplete", label: "Route Complete", tone: "warning", complete: false },
      { key: "flyerPosted", label: "Flyer Posted", tone: "warning", complete: false },
      { key: "emailSent", label: "Email Sent", tone: "warning", complete: false }
    ]
  }
];
