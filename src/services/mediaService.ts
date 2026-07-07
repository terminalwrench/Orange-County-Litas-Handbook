import { mediaItems, mediaSources } from "../data/media";
import type { MediaItem, MediaSource } from "../types";
import { getPersistenceClient, warnAndUseFallback } from "./persistence";

interface SupabaseMediaAssetRow {
  id: string;
  title: string;
  type: string;
  status: string | null;
  related_event_id: string | null;
  date: string | null;
  url: string | null;
  preview_surface: string | null;
  storage_path: string | null;
  notes: string | null;
}

export function getMediaItems(): MediaItem[] {
  return mediaItems;
}

export async function loadMediaItems() {
  const supabase = getPersistenceClient();
  if (!supabase) {
    return {
      media: getMediaItems(),
      source: "static" as const
    };
  }

  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .order("date", { ascending: false });

  if (error || !data) {
    warnAndUseFallback("Unable to load media assets from Supabase. Falling back to static data.", error);
    return {
      media: getMediaItems(),
      source: "fallback" as const
    };
  }

  return {
    media: (data as SupabaseMediaAssetRow[]).map(fromSupabaseMediaAsset),
    source: "supabase" as const
  };
}

export function getMediaSources(): MediaSource[] {
  return mediaSources;
}

export function getAssetLibraryItems(): MediaItem[] {
  return getMediaItems();
}

function fromSupabaseMediaAsset(row: SupabaseMediaAssetRow): MediaItem {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status ?? "Available",
    relatedEventId: row.related_event_id ?? undefined,
    date: row.date ?? undefined,
    url: row.url ?? undefined,
    previewSurface: row.preview_surface === "light" ? "light" : row.preview_surface === "dark" ? "dark" : undefined,
    storagePath: row.storage_path ?? undefined,
    notes: row.notes ?? undefined
  };
}
