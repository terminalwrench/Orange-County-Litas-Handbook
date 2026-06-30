import type { EventRecord, StatusItem } from "../types";
import { toDateValue } from "../utils/date";

const DEFAULT_CALENDAR_URL = `${import.meta.env.BASE_URL}calendar.ics`;

interface IcsProperty {
  name: string;
  params: Record<string, string>;
  value: string;
}

interface ParsedIcsDate {
  date: Date;
  hasTime: boolean;
}

export interface CalendarLoadResult {
  events: EventRecord[];
  source: "ics" | "fallback";
}

// Replace public/calendar.ics with a fresh exported calendar file to update
// the local source of truth. Missing or invalid files are handled by fallback data.
export async function loadCalendarEvents(
  fallbackEvents: EventRecord[],
  calendarUrl = DEFAULT_CALENDAR_URL
): Promise<CalendarLoadResult> {
  try {
    const response = await fetch(calendarUrl, { cache: "no-store" });

    if (!response.ok) {
      return { events: fallbackEvents, source: "fallback" };
    }

    const icsText = await response.text();
    const events = parseIcsCalendar(icsText);

    if (events.length === 0) {
      return { events: fallbackEvents, source: "fallback" };
    }

    return { events, source: "ics" };
  } catch {
    return { events: fallbackEvents, source: "fallback" };
  }
}

export function parseIcsCalendar(icsText: string): EventRecord[] {
  return getEventBlocks(unfoldIcsLines(icsText))
    .map(parseEventBlock)
    .filter((event): event is EventRecord => Boolean(event));
}

function unfoldIcsLines(icsText: string) {
  return icsText
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd());
}

function getEventBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = [];
      continue;
    }

    if (line === "END:VEVENT") {
      if (current) {
        blocks.push(current);
      }
      current = null;
      continue;
    }

    if (current) {
      current.push(line);
    }
  }

  return blocks;
}

function parseEventBlock(lines: string[]): EventRecord | null {
  const properties = lines.map(parseIcsProperty).filter((property): property is IcsProperty => Boolean(property));
  const startProperty = getProperty(properties, "DTSTART");

  if (!startProperty) {
    return null;
  }

  const start = parseIcsDate(startProperty);
  const endProperty = getProperty(properties, "DTEND");
  const end = endProperty ? parseIcsDate(endProperty) : start;
  const title = getPropertyValue(properties, "SUMMARY") || "Untitled Event";
  const location = getPropertyValue(properties, "LOCATION") || "TBD";
  const description = getPropertyValue(properties, "DESCRIPTION") || "";
  const uid = getPropertyValue(properties, "UID") || `${toDateValue(start.date)}-${slugify(title)}`;
  const type = inferEventType(title, description);

  return {
    id: uid,
    title,
    date: toDateValue(start.date),
    startDate: toDateValue(start.date),
    endDate: toDateValue(end.date),
    time: start.hasTime ? formatTime(start.date) : "All Day",
    location,
    city: "",
    description,
    source: "ics",
    type,
    status: "Scheduled",
    flyerStatus: "Unknown",
    notes: description,
    checklist: getChecklistForEvent(type)
  };
}

function parseIcsProperty(line: string): IcsProperty | null {
  const separatorIndex = line.indexOf(":");

  if (separatorIndex === -1) {
    return null;
  }

  const rawName = line.slice(0, separatorIndex);
  const value = unescapeIcsText(line.slice(separatorIndex + 1));
  const [name, ...paramParts] = rawName.split(";");
  const params = Object.fromEntries(
    paramParts.map((part) => {
      const [key, paramValue = ""] = part.split("=");
      return [key.toUpperCase(), paramValue.replace(/^"|"$/g, "")];
    })
  );

  return {
    name: name.toUpperCase(),
    params,
    value
  };
}

function getProperty(properties: IcsProperty[], name: string) {
  return properties.find((property) => property.name === name);
}

function getPropertyValue(properties: IcsProperty[], name: string) {
  return getProperty(properties, name)?.value;
}

function parseIcsDate(property: IcsProperty): ParsedIcsDate {
  const value = property.value;
  const isDateOnly = property.params.VALUE === "DATE" || /^\d{8}$/.test(value);

  if (isDateOnly) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return { date: new Date(year, month - 1, day), hasTime: false };
  }

  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);

  if (!match) {
    throw new Error(`Invalid ICS date value: ${value}`);
  }

  const [, year, month, day, hour, minute, second, zulu] = match;
  const date = zulu
    ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
    : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));

  return { date, hasTime: true };
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function inferEventType(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("meet") || text.includes("greet")) return "Meet & Greet";
  if (text.includes("ride")) return "Ride";
  if (text.includes("beach") || text.includes("community")) return "Community";
  return "Special Event";
}

function getChecklistForEvent(type: string): StatusItem[] {
  if (type === "Ride") {
    return [
      { label: "Venue Needed", tone: "neutral" },
      { label: "Route Needed", tone: "neutral" },
      { label: "Flyer Needed", tone: "neutral" },
      { label: "Email Needed", tone: "neutral" }
    ];
  }

  return [
    { label: "Venue Review", tone: "neutral" },
    { label: "Details Review", tone: "neutral" },
    { label: "Flyer Review", tone: "neutral" },
    { label: "Email Review", tone: "neutral" }
  ];
}

function unescapeIcsText(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
