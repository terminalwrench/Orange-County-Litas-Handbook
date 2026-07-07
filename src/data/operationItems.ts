import type { OperationItem } from "../types";

export const operationItems: OperationItem[] = [
  {
    id: "fallback-cooks-corner-venue",
    title: "Cooks Corner venue confirmation",
    category: "meet-greet",
    status: "confirmed",
    checklist: [
      { id: "venue-confirmed", label: "Venue Confirmed", complete: true },
      { id: "flyer-posted", label: "Flyer Posted", complete: true }
    ],
    priority: "high",
    dueDate: "2026-07-09",
    owner: "Leadership",
    notes: "Venue is prepared for the July meet and greet.",
    relatedEventId: "2026-07-09"
  },
  {
    id: "fallback-monthly-ride-operations",
    title: "Monthly Ride Operations",
    category: "ride",
    status: "pending",
    checklist: [
      { id: "venue-confirmed", label: "Venue Confirmed", complete: false },
      { id: "route-complete", label: "Route Complete", complete: false },
      { id: "instagram-post", label: "Instagram Post", complete: false },
      { id: "collective-post", label: "Collective Post", complete: false }
    ],
    priority: "high",
    dueDate: "2026-07-25",
    owner: "Ride Lead",
    notes: "Confirm route, meetup location, and lead/sweep plan.",
    relatedEventId: "2026-07-25"
  },
  {
    id: "fallback-beach-day-collaboration",
    title: "Beach Day Collaboration",
    category: "collaboration",
    status: "pending",
    checklist: [
      { id: "reservation-confirmed", label: "Reservation Confirmed", complete: false },
      { id: "branches-contacted", label: "Branches Contacted", complete: false },
      { id: "flyer-posted", label: "Flyer Posted", complete: false }
    ],
    priority: "normal",
    dueDate: "2026-08-15",
    owner: "Media",
    notes: "Coordinate partner tags, parking details, and arrival window.",
    relatedEventId: "2026-08-15"
  }
];
