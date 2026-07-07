export type OperationCategory = "deadline" | "birthday" | "flyer" | "planning" | "reference" | "general";

export type OperationStatus = "pending" | "planning" | "confirmed" | "completed";

export interface OperationItem {
  id: string;
  title: string;
  category: OperationCategory;
  status: OperationStatus;
  priority?: string;
  dueDate?: string;
  owner?: string;
  notes?: string;
  relatedEventId?: string;
}
