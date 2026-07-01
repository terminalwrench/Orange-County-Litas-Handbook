export type ModuleId = "home" | "operations" | "events" | "ride-planner" | "media" | "reference";

export type IconName =
  | "home"
  | "settings"
  | "calendar"
  | "route"
  | "image"
  | "book"
  | "clock"
  | "pin"
  | "check"
  | "arrow"
  | "sun"
  | "plus"
  | "file"
  | "bike"
  | "map"
  | "mail"
  | "link"
  | "box";

export interface NavItem {
  id: ModuleId;
  label: string;
  icon: IconName;
}

export interface ChecklistGroup {
  title: string;
  items: string[];
}

export interface VenueReference {
  name: string;
  category: string;
  lastVisited: string;
  note: string;
}

export interface ReferenceSection {
  id: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    label: string;
    detail: string;
    content: string[];
    disabled?: boolean;
  }>;
}

export interface AppSettings {
  name: string;
  title: string;
}

export interface BranchSettings {
  name: string;
  timezone: string;
}
