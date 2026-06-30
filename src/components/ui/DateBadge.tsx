interface DateBadgeProps {
  month: string;
  day: string;
  dateTime?: string;
  weekday?: string;
  compact?: boolean;
}

export function DateBadge({ month, day, dateTime, weekday, compact = false }: DateBadgeProps) {
  return (
    <time className={compact ? "date-badge date-badge--compact" : "date-badge"} dateTime={dateTime}>
      <span>{month}</span>
      <strong>{day}</strong>
      {weekday ? <em>{weekday}</em> : null}
    </time>
  );
}
