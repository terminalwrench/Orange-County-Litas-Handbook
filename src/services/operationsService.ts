import { operationItems } from "../data/operationItems";
import { annualBranchReports, sharedAccounts } from "../data/operations";
import type {
  AnnualBranchReport,
  BranchMetric,
  EventRecord,
  OperationCategory,
  OperationChecklistItem,
  OperationItem,
  OperationStatus,
  SharedAccount
} from "../types";
import { getPersistenceClient, warnAndUseFallback, type PersistenceResult } from "./persistence";

interface SupabaseOperationItemRow {
  id: string;
  title: string;
  category: string;
  status: string;
  checklist: OperationChecklistItem[] | null;
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
  checklist?: OperationChecklistItem[];
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

export function getSharedAccounts(): SharedAccount[] {
  return sharedAccounts;
}

export function getAvailableReportYears(events: EventRecord[] = []): number[] {
  const years = new Set([
    new Date().getFullYear(),
    ...annualBranchReports.map((report) => report.year),
    ...events.map((event) => getEventYear(event)).filter(Boolean)
  ]);

  return [...years].sort((a, b) => b - a);
}

export function getBranchMetrics(
  events: EventRecord[],
  options: { memberCount?: number; today?: Date } = {}
): BranchMetric[] {
  const today = options.today ?? new Date();
  const upcomingEvents = events.filter((event) => daysUntil(event, today) >= 0);
  const memberCount = options.memberCount ?? 0;

  return [
    { label: "Members", value: memberCount },
    { label: "Active Members", value: memberCount },
    { label: "Total Rides", value: events.filter(isRideEvent).length },
    { label: "Meet & Greets", value: events.filter(isMeetAndGreetEvent).length },
    { label: "Collaborations", value: events.filter(isCollaborationEvent).length },
    { label: "Upcoming Events", value: upcomingEvents.length }
  ];
}

export function getAnnualBranchReport(events: EventRecord[], year: number): AnnualBranchReport {
  const baseReport = annualBranchReports.find((report) => report.year === year);
  const eventsForYear = events.filter((event) => getEventYear(event) === year);

  return {
    year,
    totalRides: eventsForYear.filter(isRideEvent).length,
    meetAndGreets: eventsForYear.filter(isMeetAndGreetEvent).length,
    collaborations: eventsForYear.filter(isCollaborationEvent).length,
    beginnerRides: eventsForYear.filter(isBeginnerRideEvent).length,
    estimatedRiders: baseReport?.estimatedRiders ?? 0,
    newMembers: baseReport?.newMembers ?? 0,
    charityEvents: eventsForYear.filter(isCharityEvent).length,
    partnerBusinesses: baseReport?.partnerBusinesses ?? 0
  };
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
    checklist: toOperationChecklist(row.checklist, toOperationCategory(row.category)),
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
    checklist: input.checklist ?? getDefaultOperationChecklist(input.category),
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
    checklist: input.checklist ?? getDefaultOperationChecklist(input.category),
    priority: input.priority,
    dueDate: input.dueDate,
    owner: input.owner,
    notes: input.notes,
    relatedEventId: input.relatedEventId
  };
}

function toOperationCategory(value: string): OperationCategory {
  const categories: OperationCategory[] = ["ride", "meet-greet", "collaboration", "major-event"];
  if (categories.includes(value as OperationCategory)) return value as OperationCategory;
  if (value === "flyer") return "meet-greet";
  if (value === "planning" || value === "deadline" || value === "general") return "ride";
  if (value === "reference" || value === "birthday") return "major-event";
  return "ride";
}

function toOperationStatus(value: string): OperationStatus {
  if (value === "planned" || value === "planning") return "pending";
  if (value === "complete") return "completed";
  if (value === "blocked") return "pending";

  const statuses: OperationStatus[] = ["pending", "confirmed", "completed"];
  return statuses.includes(value as OperationStatus) ? value as OperationStatus : "pending";
}

export function getDefaultOperationChecklist(category: OperationCategory): OperationChecklistItem[] {
  const items: Record<OperationCategory, string[]> = {
    ride: ["Venue Confirmed", "Route Complete", "Instagram Post", "Collective Post"],
    "meet-greet": ["Venue Confirmed", "Flyer Posted"],
    collaboration: ["Reservation Confirmed", "Branches Contacted", "Flyer Posted"],
    "major-event": ["Registration Complete", "Hosted Ride Planned", "Flyer Posted"]
  };

  return items[category].map((label) => ({
    id: slugify(label),
    label,
    complete: false
  }));
}

function toOperationChecklist(value: unknown, category: OperationCategory): OperationChecklistItem[] {
  if (!Array.isArray(value)) return getDefaultOperationChecklist(category);

  const checklist = value
    .filter((item): item is Partial<OperationChecklistItem> => typeof item === "object" && item !== null)
    .map((item) => {
      const label = typeof item.label === "string" ? item.label : "";

      return {
        id: typeof item.id === "string" ? item.id : slugify(label),
        label,
        complete: Boolean(item.complete)
      };
    })
    .filter((item) => item.label);

  return checklist.length > 0 ? checklist : getDefaultOperationChecklist(category);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

function daysUntil(event: EventRecord, today: Date) {
  const eventDate = new Date(`${event.startDate}T00:00:00`);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  return Math.round((end - start) / 86_400_000);
}

function getEventYear(event: EventRecord) {
  return Number(event.startDate.slice(0, 4));
}

function isRideEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("ride") && !isMajorEvent(event);
}

function isBeginnerRideEvent(event: EventRecord) {
  const text = `${event.title} ${event.type} ${event.rideDifficulty ?? ""}`.toLowerCase();
  return isRideEvent(event) && text.includes("beginner");
}

function isMeetAndGreetEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("meet") || text.includes("greet");
}

function isCollaborationEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("collaboration") || text.includes("community") || text.includes("branch");
}

function isCharityEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("charity") || text.includes("fundraiser") || text.includes("dgr") || text.includes("distinguished");
}

function isMajorEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("major") || text.includes("special") || text.includes("babes") || text.includes("born free") || text.includes("anniversary") || text.includes("poker");
}
