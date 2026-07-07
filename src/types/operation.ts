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
