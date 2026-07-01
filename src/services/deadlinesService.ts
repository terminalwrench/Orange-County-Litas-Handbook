import { deadlineRecords } from "../data/deadlines";
import type { Deadline } from "../types";
import { parseDate } from "../utils/date";

export function getDeadlines(): Deadline[] {
  return deadlineRecords;
}

export function getUpcomingDeadlines(today = new Date(), days = 5): Deadline[] {
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = start + days * 86_400_000;

  return getDeadlines().filter((deadline) => {
    const date = parseDate(deadline.date);
    const value = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return value >= start && value <= end;
  });
}
