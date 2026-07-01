import type { IconName } from "./settings";

export interface MediaItem {
  id: string;
  title: string;
  type: string;
  status: string;
  relatedEventId?: string;
  date?: string;
  url?: string;
}

export interface MediaSource {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  url?: string;
  targetId?: string;
}
