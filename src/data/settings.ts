import type { ExternalResource, MediaSource } from "../types";

export const externalResources: ExternalResource[] = [
  {
    id: "instagram",
    title: "Instagram",
    description: "Branch social profile for public posts, tags, and event visibility.",
    icon: "image"
  },
  {
    id: "shared-google-calendar",
    title: "Shared Google Calendar",
    description: "Shared branch calendar for events, rides, and planning dates.",
    icon: "calendar"
  },
  {
    id: "google-keep",
    title: "Google Keep",
    description: "Shared notes space for quick branch reminders and planning notes.",
    icon: "file"
  },
  {
    id: "shared-icloud-album",
    title: "Shared iCloud Album",
    description: "Shared photo album for event images and branch media collection.",
    icon: "image"
  },
  {
    id: "litas-global",
    title: "Litas Global",
    description: "Official Litas global site for national context and public information.",
    icon: "link",
    url: "https://thelitas.co"
  }
];

export const mediaSources: MediaSource[] = [
  {
    id: "shared-icloud-album",
    title: "Shared iCloud Album",
    description: "Primary shared photo album once the branch album link is configured.",
    icon: "image"
  },
  {
    id: "canva-workspace",
    title: "Canva Workspace",
    description: "Design workspace for event flyers and branch graphics.",
    icon: "image"
  },
  {
    id: "official-branch-logos",
    title: "Official Branch Logos",
    description: "Current logo assets already available in the Asset Library.",
    icon: "box",
    targetId: "asset-library"
  },
  {
    id: "flyer-archive",
    title: "Flyer Archive",
    description: "Archive location for final event flyers once a link is configured.",
    icon: "file"
  }
];
