import type {
  AppSettings,
  BranchSettings,
  NavItem,
  ReferenceSection
} from "../types";

export const appSettings: AppSettings = {
  name: "Orange County Litas Operations Center",
  title: "Orange County Litas Operations Center"
};

export const branchSettings: BranchSettings = {
  name: "Orange County Litas",
  timezone: "America/Los_Angeles"
};

export const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "operations", label: "Operations", icon: "settings" },
  { id: "events", label: "Events", icon: "calendar" },
  { id: "ride-planner", label: "Ride Planner", icon: "route" },
  { id: "media", label: "Branch Assets", icon: "image" },
  { id: "reference", label: "Reference", icon: "book" }
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
          "Use official source assets from Branch Assets.",
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
