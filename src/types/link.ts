import type { IconName } from "./settings";

export interface ExternalResource {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  url?: string;
  targetId?: string;
}
