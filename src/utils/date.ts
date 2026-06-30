export function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid date value: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

export function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysBetweenDates(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86_400_000);
}

export function isWithinCurrentWeek(dateValue: string, referenceValue: string): boolean {
  const date = parseDate(dateValue);
  const reference = parseDate(referenceValue);
  const day = reference.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(reference);
  start.setDate(reference.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export function filterDeadlinesWithinDays<T extends { date: string }>(
  deadlines: T[],
  referenceValue: string,
  days: number
): T[] {
  const reference = parseDate(referenceValue);
  reference.setHours(0, 0, 0, 0);
  const end = new Date(reference);
  end.setDate(reference.getDate() + days);
  end.setHours(23, 59, 59, 999);
  return deadlines.filter((deadline) => {
    const date = parseDate(deadline.date);
    return date >= reference && date <= end;
  });
}
