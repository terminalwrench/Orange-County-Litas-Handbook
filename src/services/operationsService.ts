import { operationItems } from "../data/operationItems";
import type { OperationCategory, OperationItem, OperationStatus } from "../types";
import { getPersistenceClient, warnAndUseFallback } from "./persistence";

interface SupabaseOperationItemRow {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  owner: string | null;
  notes: string | null;
  related_event_id: string | null;
}

export function getOperationItems(): OperationItem[] {
  return operationItems;
}

export async function loadOperationItems() {
  const supabase = getPersistenceClient();
  if (!supabase) {
    return {
      items: getOperationItems(),
      source: "static" as const
    };
  }

  const { data, error } = await supabase
    .from("operation_items")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error || !data) {
    warnAndUseFallback("Unable to load operation items from Supabase. Falling back to static operation data.", error);
    return {
      items: getOperationItems(),
      source: "fallback" as const
    };
  }

  return {
    items: (data as SupabaseOperationItemRow[]).map(fromSupabaseOperationItem),
    source: "supabase" as const
  };
}

function fromSupabaseOperationItem(row: SupabaseOperationItemRow): OperationItem {
  return {
    id: row.id,
    title: row.title,
    category: toOperationCategory(row.category),
    status: toOperationStatus(row.status),
    priority: row.priority ?? undefined,
    dueDate: row.due_date ?? undefined,
    owner: row.owner ?? undefined,
    notes: row.notes ?? undefined,
    relatedEventId: row.related_event_id ?? undefined
  };
}

function toOperationCategory(value: string): OperationCategory {
  const categories: OperationCategory[] = ["deadline", "birthday", "flyer", "planning", "reference", "general"];
  return categories.includes(value as OperationCategory) ? value as OperationCategory : "general";
}

function toOperationStatus(value: string): OperationStatus {
  const statuses: OperationStatus[] = ["pending", "planned", "confirmed", "complete", "blocked"];
  return statuses.includes(value as OperationStatus) ? value as OperationStatus : "pending";
}
