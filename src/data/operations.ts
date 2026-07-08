import type { AnnualBranchReport, SharedAccount } from "../types";

export const sharedAccounts: SharedAccount[] = [
  {
    id: "instagram",
    service: "Instagram",
    icon: "image",
    username: "@thelitasorangecounty",
    configured: true,
    lastUpdated: "2026-07-01"
  },
  {
    id: "canva",
    service: "Canva",
    icon: "box",
    configured: false
  },
  {
    id: "shared-calendar",
    service: "Shared Calendar",
    icon: "calendar",
    username: "orangecountylitas@gmail.com",
    configured: true,
    lastUpdated: "2026-07-01"
  },
  {
    id: "google-keep",
    service: "Google Keep",
    icon: "file",
    configured: false
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

// TODO: Real credential storage requires authentication, RLS, and encrypted
// secret storage before implementation.
