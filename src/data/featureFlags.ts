export const featureFlags = {
  branchNotes: false,
  // Keep src/data/events.ts authoritative unless calendar import is intentionally enabled.
  icsCalendar: false
} as const;
