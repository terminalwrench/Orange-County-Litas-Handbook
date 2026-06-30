interface DateBadgeProps {
  month: string;
  day: string;
  weekday?: string;
  compact?: boolean;
}

export function DateBadge({ month, day, weekday, compact = false }: DateBadgeProps) {
  return (
    <time className={compact ? "date-badge date-badge--compact" : "date-badge"} dateTime={`${month} ${day}`}>
      <span>{month}</span>
      <strong>{day}</strong>
      {weekday ? <em>{weekday}</em> : null}
    </time>
  );
}
