import { birthdayRecords } from "../data/birthdays";
import type { Birthday } from "../types";

export function getBirthdays(): Birthday[] {
  return birthdayRecords;
}

export function getUpcomingBirthdays(): Birthday[] {
  return getBirthdays();
}
