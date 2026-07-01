import { mediaItems, mediaSources } from "../data/media";
import type { MediaItem, MediaSource } from "../types";

export function getMediaItems(): MediaItem[] {
  return mediaItems;
}

export function getMediaSources(): MediaSource[] {
  return mediaSources;
}

export function getAssetLibraryItems(): MediaItem[] {
  return getMediaItems();
}
