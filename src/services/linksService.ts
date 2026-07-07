import { usefulLinks } from "../data/links";
import type { ExternalResource } from "../types";
import { getPersistenceClient, warnAndUseFallback } from "./persistence";

interface SupabaseReferenceLinkRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  url: string | null;
  target_id: string | null;
  icon: string | null;
}

export function getUsefulLinks(): ExternalResource[] {
  return usefulLinks;
}

export async function loadUsefulLinks() {
  const supabase = getPersistenceClient();
  if (!supabase) {
    return {
      links: getUsefulLinks(),
      source: "static" as const
    };
  }

  const { data, error } = await supabase
    .from("reference_links")
    .select("*")
    .order("title", { ascending: true });

  if (error || !data) {
    warnAndUseFallback("Unable to load reference links from Supabase. Falling back to static links.", error);
    return {
      links: getUsefulLinks(),
      source: "fallback" as const
    };
  }

  return {
    links: (data as SupabaseReferenceLinkRow[]).map(fromSupabaseReferenceLink),
    source: "supabase" as const
  };
}

export function getConfiguredLinks(): ExternalResource[] {
  return getUsefulLinks().filter((link) => Boolean(link.url));
}

function fromSupabaseReferenceLink(row: SupabaseReferenceLinkRow): ExternalResource {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? undefined,
    url: row.url ?? undefined,
    targetId: row.target_id ?? undefined,
    icon: toKnownIcon(row.icon)
  };
}

function toKnownIcon(icon: string | null): ExternalResource["icon"] {
  const known = ["home", "settings", "calendar", "route", "image", "book", "clock", "pin", "check", "arrow", "sun", "plus", "file", "bike", "map", "mail", "link", "box"];
  return known.includes(icon ?? "") ? icon as ExternalResource["icon"] : "link";
}
