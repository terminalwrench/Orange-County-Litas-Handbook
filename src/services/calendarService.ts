import type { EventRecord, StatusItem } from "../types";
import { toDateValue } from "../utils/date";
import { getPersistenceClient } from "./persistence";

export const PUBLIC_GOOGLE_CALENDAR_ICS_URL =
  "https://calendar.google.com/calendar/ical/orangecountylitas%40gmail.com/public/basic.ics";

const configuredCalendarUrl = import.meta.env.VITE_EVENTS_ICS_URL as string | undefined;
const configuredCalendarFunctionName = import.meta.env.VITE_EVENTS_ICS_FUNCTION_NAME as string | undefined;
const DEFAULT_CALENDAR_URL = configuredCalendarUrl?.trim() || PUBLIC_GOOGLE_CALENDAR_ICS_URL;
const DEFAULT_CALENDAR_FUNCTION_NAME = configuredCalendarFunctionName?.trim() || "import-events-ics";

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

export interface CalendarFetchResult {
  events: EventRecord[];
  error?: string;
}

export function getEventsIcsUrl() {
  return DEFAULT_CALENDAR_URL;
}

export function hasEventsIcsUrl() {
  return getEventsIcsUrl().trim().length > 0;
}

// Replace public/calendar.ics with a fresh exported calendar file to update
// the local source of truth. Missing or invalid files are handled by fallback data.
export async function loadCalendarEvents(
  fallbackEvents: EventRecord[],
  calendarUrl = DEFAULT_CALENDAR_URL
): Promise<CalendarLoadResult> {
  const result = await fetchCalendarEvents(calendarUrl);

  if (result.error || result.events.length === 0) {
    return { events: fallbackEvents, source: "fallback" };
  }

  return { events: result.events, source: "ics" };
}

export async function fetchCalendarEvents(
  calendarUrl = DEFAULT_CALENDAR_URL
): Promise<CalendarFetchResult> {
  try {
    const result = await fetchCalendarIcsText(calendarUrl);

    if (result.error) {
      return {
        events: [],
        error: result.error
      };
    }

    return { events: parseIcsCalendar(result.icsText) };
  } catch (error) {
    console.warn("[calendar] Unable to fetch calendar feed.", error);
    return {
      events: [],
      error: "Could not import the public Google Calendar feed. Existing Supabase events were kept."
    };
  }
}

async function fetchCalendarIcsText(calendarUrl: string) {
  const supabase = getPersistenceClient();

  if (supabase) {
    const functionUrl = getEdgeFunctionUrl(DEFAULT_CALENDAR_FUNCTION_NAME);
    console.info("[calendar] Calling Events ICS Edge Function.", {
      functionName: DEFAULT_CALENDAR_FUNCTION_NAME,
      functionUrl,
      calendarUrl
    });

    const { data, error } = await supabase.functions.invoke(DEFAULT_CALENDAR_FUNCTION_NAME, {
      body: { calendarUrl }
    });

    await logEdgeFunctionResponse(error, data);

    if (error) {
      console.warn("[calendar] Edge Function could not fetch calendar feed.", error);
      return {
        icsText: "",
        error: "Could not import the public Google Calendar feed. Existing Supabase events were kept."
      };
    }

    const response = data as { icsText?: string; error?: string } | null;

    if (!response?.icsText) {
      return {
        icsText: "",
        error: response?.error || "Calendar feed could not be reached. Existing events were kept."
      };
    }

    return {
      icsText: response.icsText,
      error: ""
    };
  }

  const response = await fetch(calendarUrl, { cache: "no-store" });

  console.info("[calendar] Direct ICS fetch response.", {
    url: calendarUrl,
    status: response.status,
    statusText: response.statusText
  });

  if (!response.ok) {
    return {
      icsText: "",
      error: "Calendar feed could not be reached. Existing events were kept."
    };
  }

  return {
    icsText: await response.text(),
    error: ""
  };
}

function getEdgeFunctionUrl(functionName: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) return "(Supabase URL not configured)";

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`;
}

async function logEdgeFunctionResponse(error: unknown, data: unknown) {
  const context = getErrorContext(error);
  const response = context instanceof Response ? context : undefined;
  const responseBody = response ? await readResponseBody(response) : undefined;

  console.info("[calendar] Events ICS Edge Function response.", {
    status: response?.status ?? "(not exposed by Supabase client)",
    statusText: response?.statusText ?? "",
    responseBody: responseBody ?? data ?? null,
    data,
    error
  });
}

function getErrorContext(error: unknown) {
  if (!error || typeof error !== "object") return undefined;

  return (error as { context?: unknown }).context;
}

async function readResponseBody(response: Response) {
  try {
    return await response.clone().text();
  } catch (error) {
    console.warn("[calendar] Unable to read Edge Function response body.", error);
    return undefined;
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
  const location = getPropertyValue(properties, "LOCATION") || "";
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
    status: "Planning",
    flyerStatus: "Unknown",
    venueConfirmed: Boolean(location),
    routeComplete: type !== "Ride",
    flyerPosted: false,
    emailSent: false,
    notes: description,
    externalUid: uid,
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

  if (
    text.includes("born free")
    || text.includes("babes ride out")
    || text.includes("babes in borrego")
    || text.includes("paradise road show")
    || text.includes("distinguished gentleman")
  ) {
    return "Major Event";
  }

  if (text.includes("meet") || text.includes("greet")) return "Meet & Greet";
  if (text.includes("ride")) return "Ride";
  if (text.includes("beach") || text.includes("community")) return "Community";
  return "Special Event";
}

function getChecklistForEvent(type: string): StatusItem[] {
  const routeComplete = type !== "Ride";

  return [
    { key: "venueConfirmed", label: "Venue Confirmed", tone: "warning", complete: false },
    { key: "routeComplete", label: "Route Complete", tone: routeComplete ? "success" : "warning", complete: routeComplete },
    { key: "flyerPosted", label: "Flyer Posted", tone: "warning", complete: false },
    { key: "emailSent", label: "Email Sent", tone: "warning", complete: false }
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
