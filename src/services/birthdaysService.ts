import { birthdayRecords } from "../data/birthdays";
import type { Birthday } from "../types";

export function getBirthdays(): Birthday[] {
  return birthdayRecords;
}

export function getUpcomingBirthdays(today = new Date()): Birthday[] {
  const currentMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(today);
  return getBirthdays().filter((birthday) => birthday.dateLabel.startsWith(currentMonth));
}
