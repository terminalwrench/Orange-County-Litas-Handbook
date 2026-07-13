const DEFAULT_ICS_URL =
  "https://calendar.google.com/calendar/ical/orangecountylitas%40gmail.com/public/basic.ics";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://terminalwrench.github.io"
];

Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed." },
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body = await readJsonBody(request);
    const calendarUrl = getCalendarUrl(body?.calendarUrl);

    const response = await fetch(calendarUrl, {
      headers: {
        accept: "text/calendar,text/plain,*/*"
      }
    });

    if (!response.ok) {
      return jsonResponse(
        { error: "Calendar feed could not be reached." },
        { status: 502, headers: corsHeaders }
      );
    }

    const icsText = await response.text();

    if (!icsText.includes("BEGIN:VCALENDAR")) {
      return jsonResponse(
        { error: "Calendar feed did not return a valid ICS calendar." },
        { status: 502, headers: corsHeaders }
      );
    }

    return jsonResponse(
      { icsText },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[import-events-ics] Calendar import failed.", error);

    return jsonResponse(
      { error: "Could not import the public Google Calendar feed." },
      { status: 500, headers: corsHeaders }
    );
  }
});

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getCalendarUrl(candidate: unknown) {
  const configuredUrl = Deno.env.get("EVENTS_ICS_URL")?.trim();
  const value = typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : configuredUrl || DEFAULT_ICS_URL;
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error("Calendar feed URL must use HTTPS.");
  }

  if (url.hostname !== "calendar.google.com") {
    throw new Error("Calendar feed URL must come from Google Calendar.");
  }

  return url.toString();
}

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigin = getAllowedOrigin(origin);

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
}

function getAllowedOrigin(origin: string) {
  const configuredOrigins = Deno.env.get("ALLOWED_ORIGINS")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;

  if (origin && allowedOrigins.includes(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;

  return allowedOrigins[0];
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...init.headers,
      "Content-Type": "application/json"
    }
  });
}
