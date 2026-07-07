import { operationItems } from "../data/operationItems";
import type { OperationCategory, OperationItem, OperationStatus } from "../types";
import { getPersistenceClient, warnAndUseFallback, type PersistenceResult } from "./persistence";

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

export interface OperationItemInput {
  id?: string;
  title: string;
  category: OperationCategory;
  status: OperationStatus;
  priority?: string;
  dueDate?: string;
  owner?: string;
  notes?: string;
  relatedEventId?: string;
}

export interface OperationItemsLoadResult {
  items: OperationItem[];
  source: "static" | "supabase" | "fallback";
}

export function getOperationItems(): OperationItem[] {
  return operationItems;
}

export async function loadOperationItems(): Promise<OperationItemsLoadResult> {
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

  if (error) {
    if (isOperationTableUnavailable(error)) {
      warnAndUseFallback("Supabase operation_items table is unavailable. Showing an empty live operations state instead of demo data.", error);
      return {
        items: [],
        source: "supabase" as const
      };
    }

    warnAndUseFallback("Unable to load operation items from Supabase. Falling back to static operation data.", error);
    return {
      items: getOperationItems(),
      source: "fallback" as const
    };
  }

  return {
    items: ((data ?? []) as SupabaseOperationItemRow[]).map(fromSupabaseOperationItem),
    source: "supabase" as const
  };
}

export async function createOperationItem(input: OperationItemInput): Promise<PersistenceResult<OperationItem>> {
  return saveOperationItem(input);
}

export async function updateOperationItem(input: OperationItemInput): Promise<PersistenceResult<OperationItem>> {
  return saveOperationItem(input);
}

export async function updateOperationItemStatus(
  item: OperationItem,
  status: OperationStatus
): Promise<PersistenceResult<OperationItem>> {
  return saveOperationItem({ ...item, status });
}

export async function deleteOperationItem(item: OperationItem): Promise<PersistenceResult<OperationItem>> {
  const supabase = getPersistenceClient();

  if (!supabase || !isUuid(item.id)) {
    return {
      data: item,
      source: "fallback"
    };
  }

  const { error } = await supabase
    .from("operation_items")
    .delete()
    .eq("id", item.id);

  if (error) {
    warnAndUseFallback("Unable to delete operation item from Supabase. Keeping local UI state stable.", error);
    return {
      data: item,
      source: "fallback"
    };
  }

  return {
    data: item,
    source: "supabase"
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

async function saveOperationItem(input: OperationItemInput): Promise<PersistenceResult<OperationItem>> {
  const supabase = getPersistenceClient();

  if (!supabase) {
    return {
      data: toLocalOperationItem(input),
      source: "fallback"
    };
  }

  const payload = toSupabaseOperationPayload(input);
  const query = input.id && isUuid(input.id)
    ? supabase.from("operation_items").update(payload).eq("id", input.id).select().single()
    : supabase.from("operation_items").insert(payload).select().single();

  const { data, error } = await query;

  if (error || !data) {
    warnAndUseFallback("Unable to save operation item to Supabase. Using local UI state instead.", error);
    return {
      data: toLocalOperationItem(input),
      source: "fallback"
    };
  }

  return {
    data: fromSupabaseOperationItem(data as SupabaseOperationItemRow),
    source: "supabase"
  };
}

function toSupabaseOperationPayload(input: OperationItemInput) {
  return {
    title: input.title,
    category: input.category,
    status: input.status,
    priority: input.priority ?? null,
    due_date: input.dueDate || null,
    owner: input.owner ?? null,
    notes: input.notes ?? null,
    related_event_id: input.relatedEventId && isUuid(input.relatedEventId) ? input.relatedEventId : null
  };
}

function toLocalOperationItem(input: OperationItemInput): OperationItem {
  return {
    id: input.id ?? createLocalId("operation"),
    title: input.title,
    category: input.category,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
    owner: input.owner,
    notes: input.notes,
    relatedEventId: input.relatedEventId
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function isOperationTableUnavailable(error: unknown) {
  const candidate = error as { code?: string; message?: string; details?: string };
  const message = `${candidate.message ?? ""} ${candidate.details ?? ""}`.toLowerCase();

  return candidate.code === "42P01"
    || candidate.code === "PGRST205"
    || message.includes("operation_items")
    || message.includes("could not find the table");
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}
