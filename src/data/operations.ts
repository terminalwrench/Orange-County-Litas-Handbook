import type { AnnualBranchReport, SharedAccount } from "../types";

export const sharedAccounts: SharedAccount[] = [
  {
    id: "instagram",
    service: "Instagram",
    icon: "image",
    username: "@thelitasorangecounty",
    url: "https://www.instagram.com/thelitasorangecounty/",
    configured: true,
    lastUpdated: "2026-07-01"
  },
  {
    id: "canva",
    service: "Canva",
    icon: "box",
    url: "https://www.canva.com/",
    configured: true
  },
  {
    id: "shared-calendar",
    service: "Shared Calendar",
    icon: "calendar",
    username: "orangecountylitas@gmail.com",
    url: "https://calendar.google.com/calendar/u/0/r?cid=orangecountylitas%40gmail.com",
    configured: true,
    lastUpdated: "2026-07-01"
  },
  {
    id: "google-keep",
    service: "Google Keep",
    icon: "file",
    url: "https://keep.google.com/",
    configured: true
  },
  {
    id: "icloud-album",
    service: "iCloud Album",
    icon: "image",
    configured: false
  },
  {
    id: "shared-gmail",
    service: "Shared Gmail",
    icon: "mail",
    username: "orangecountylitas@gmail.com",
    url: "https://mail.google.com/mail/u/0/",
    configured: true,
    lastUpdated: "2026-07-01"
  }
];

export const annualBranchReports: AnnualBranchReport[] = [
  {
    year: 2026,
    totalRides: 0,
    meetAndGreets: 0,
    collaborations: 0,
    beginnerRides: 0,
    estimatedRiders: 0,
    newMembers: 0,
    charityEvents: 0,
    partnerBusinesses: 0
  },
  {
    year: 2025,
    totalRides: 0,
    meetAndGreets: 0,
    collaborations: 0,
    beginnerRides: 0,
    estimatedRiders: 0,
    newMembers: 0,
    charityEvents: 0,
    partnerBusinesses: 0
  },
  {
    year: 2024,
    totalRides: 0,
    meetAndGreets: 0,
    collaborations: 0,
    beginnerRides: 0,
    estimatedRiders: 0,
    newMembers: 0,
    charityEvents: 0,
    partnerBusinesses: 0
  }
];

// TODO: Move saved secrets into encrypted storage before expanding beyond the
// founder-only admin portal. Passwords are intentionally optional here.
