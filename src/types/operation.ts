import type { IconName } from "./settings";

export type OperationCategory = "ride" | "meet-greet" | "collaboration" | "major-event";

export type OperationStatus = "pending" | "confirmed" | "completed";

export interface OperationChecklistItem {
  id: string;
  label: string;
  complete: boolean;
}

export interface OperationItem {
  id: string;
  title: string;
  category: OperationCategory;
  status: OperationStatus;
  checklist: OperationChecklistItem[];
  priority?: string;
  dueDate?: string;
  owner?: string;
  notes?: string;
  relatedEventId?: string;
}

export interface BranchMetric {
  label: string;
  value: string | number;
}

export interface SharedAccount {
  id: string;
  service: string;
  icon: IconName;
  username?: string;
  password?: string;
  url?: string;
  configured: boolean;
  lastUpdated?: string;
}

export interface AnnualBranchReport {
  year: number;
  totalRides: number;
  meetAndGreets: number;
  collaborations: number;
  beginnerRides: number;
  estimatedRiders: number;
  newMembers: number;
  charityEvents: number;
  partnerBusinesses: number;
}
