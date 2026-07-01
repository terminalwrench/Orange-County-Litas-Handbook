import type { MediaItem, MediaSource } from "../types";
import { assets } from "./assets";

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
