export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
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
