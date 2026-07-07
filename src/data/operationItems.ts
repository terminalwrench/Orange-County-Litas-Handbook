import type { OperationItem } from "../types";

export const operationItems: OperationItem[] = [
  {
    id: "fallback-cooks-corner-venue",
    title: "Cooks Corner venue confirmation",
    category: "planning",
    status: "confirmed",
    priority: "high",
    dueDate: "2026-07-09",
    owner: "Leadership",
    notes: "Venue is prepared for the July meet and greet.",
    relatedEventId: "2026-07-09"
  },
  {
    id: "fallback-monthly-ride-planning",
    title: "Monthly ride route planning",
    category: "planning",
    status: "pending",
    priority: "high",
    dueDate: "2026-07-25",
    owner: "Ride Lead",
    notes: "Confirm route, meetup location, and lead/sweep plan.",
    relatedEventId: "2026-07-25"
  },
  {
    id: "fallback-beach-day-flyer",
    title: "Beach day flyer",
    category: "flyer",
    status: "pending",
    priority: "normal",
    dueDate: "2026-08-15",
    owner: "Media",
    notes: "Coordinate partner tags, parking details, and arrival window.",
    relatedEventId: "2026-08-15"
  }
];
