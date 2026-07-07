import { useState, type FormEvent } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { DateInput, SelectInput, Textarea, TextInput } from "../components/ui/inputs";
import type { EventRecord, OperationCategory, OperationItem, OperationStatus } from "../types";
import { getPastEvents } from "../services/eventsService";
import type { OperationItemInput } from "../services/operationsService";
import type { PersistenceResult } from "../services/persistence";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

const operationCategories: OperationCategory[] = ["deadline", "birthday", "flyer", "planning", "reference", "general"];
const operationStatuses: OperationStatus[] = ["pending", "planned", "confirmed", "complete", "blocked"];

interface OperationsProps {
  eventRecords: EventRecord[];
  operationItems: OperationItem[];
  operationItemsSource: "static" | "supabase" | "fallback";
  isLoading: boolean;
  isPersistenceConfigured: boolean;
  onCreateOperationItem: (input: OperationItemInput) => Promise<PersistenceResult<OperationItem>>;
  onUpdateOperationItem: (input: OperationItemInput) => Promise<PersistenceResult<OperationItem>>;
  onUpdateOperationStatus: (
    item: OperationItem,
    status: OperationStatus
  ) => Promise<PersistenceResult<OperationItem>>;
  onDeleteOperationItem: (item: OperationItem) => Promise<PersistenceResult<OperationItem>>;
}

interface OperationFormState {
  id?: string;
  title: string;
  category: OperationCategory;
  status: OperationStatus;
  priority: string;
  dueDate: string;
  owner: string;
  notes: string;
}

const emptyOperationForm: OperationFormState = {
  title: "",
  category: "general",
  status: "pending",
  priority: "",
  dueDate: "",
  owner: "",
  notes: ""
};

export function Operations({
  eventRecords,
  operationItems,
  operationItemsSource,
  isLoading,
  isPersistenceConfigured,
  onCreateOperationItem,
  onUpdateOperationItem,
  onUpdateOperationStatus,
  onDeleteOperationItem
}: OperationsProps) {
  const completedEvents = getPastEvents(eventRecords);
  const activeOperationItems = operationItems.filter((item) => item.status !== "complete");
  const completedOperationItems = operationItems.filter((item) => item.status === "complete");
  const planningOperationItems = operationItems.filter((item) => item.category === "planning" || item.status === "planned");
  const upcomingDeadlineItems = operationItems.filter(isUpcomingDeadline);
  const [formState, setFormState] = useState<OperationFormState>(emptyOperationForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const isEditing = Boolean(formState.id);
  const metrics = [
    { label: "Open operation items", value: activeOperationItems.length },
    { label: "Completed items", value: completedOperationItems.length },
    { label: "Planning items", value: planningOperationItems.length },
    { label: "Upcoming deadlines", value: upcomingDeadlineItems.length }
  ];

  function openNewItemForm() {
    setFormState(emptyOperationForm);
    setEditorOpen(true);
    setSaveMessage("");
    setSaveError("");
  }

  function openEditForm(item: OperationItem) {
    setFormState(toOperationFormState(item));
    setEditorOpen(true);
    setSaveMessage("");
    setSaveError("");
  }

  function closeEditor() {
    setFormState(emptyOperationForm);
    setEditorOpen(false);
    setSaveMessage("");
    setSaveError("");
  }

  function updateForm(field: keyof OperationFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleStatusChange(item: OperationItem, status: OperationStatus) {
    setSavingItemId(item.id);
    setSaveError("");
    setSaveMessage("");

    try {
      const result = await onUpdateOperationStatus(item, status);
      if (result.source === "fallback" && isPersistenceConfigured) {
        setSaveError("Status could not be saved to Supabase. The local view was kept stable.");
      } else {
        setSaveMessage(result.source === "supabase" ? "Status updated." : "Status saved locally for this session.");
      }
      if (formState.id === item.id) {
        setFormState(toOperationFormState(result.data));
      }
    } catch (error) {
      console.warn("[operations] Unable to update operation item status.", error);
      setSaveError("Status could not be saved. The page is still stable; try again in a moment.");
    } finally {
      setSavingItemId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.title.trim()) {
      setSaveError("Title is required.");
      setSaveMessage("");
      return;
    }

    setSavingItemId(formState.id ?? "new");
    setSaveError("");
    setSaveMessage("");

    const input = toOperationInput(formState);

    try {
      const result = isEditing
        ? await onUpdateOperationItem(input)
        : await onCreateOperationItem(input);

      setFormState(toOperationFormState(result.data));
      if (result.source === "fallback" && isPersistenceConfigured) {
        setSaveError("Item could not be saved to Supabase. The local view was kept stable.");
      } else {
        setSaveMessage(result.source === "supabase" ? (isEditing ? "Item updated." : "Item added.") : "Saved locally for this session.");
      }
      setEditorOpen(true);
    } catch (error) {
      console.warn("[operations] Unable to save operation item.", error);
      setSaveError("Item could not be saved. The page is still stable; try again in a moment.");
    } finally {
      setSavingItemId(null);
    }
  }

  async function handleDeleteItem(item: OperationItem) {
    if (!window.confirm("Delete this operation item? This action cannot be undone.")) return;

    setSavingItemId(item.id);
    setSaveError("");
    setSaveMessage("");

    try {
      const result = await onDeleteOperationItem(item);
      if (result.source === "fallback" && isPersistenceConfigured) {
        setSaveError("Operation item could not be deleted from Supabase.");
      } else {
        setSaveMessage(result.source === "supabase" ? "Operation item deleted." : "Operation item deleted locally for this session.");
        if (formState.id === item.id) closeEditor();
      }
    } catch (error) {
      console.warn("[operations] Unable to delete operation item.", error);
      setSaveError("Operation item could not be deleted. Try again in a moment.");
    } finally {
      setSavingItemId(null);
    }
  }

  return (
    <PageContainer>
      <div className="page-title">
        <span>Operations</span>
        <h1>Branch operations overview</h1>
      </div>
      <div className="module-grid">
        <DashboardCard>
          <SectionHeader
            title="Operational Status"
            action={<Button type="button" variant="secondary" onClick={openNewItemForm}>Add item</Button>}
          />
          {isLoading ? (
            <EmptyState title="Loading operation items" message="Checking the configured operations source." />
          ) : operationItems.length > 0 ? (
            <div className="operation-list">
              {operationItems.map((item) => (
                <article className="operation-row" key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <em>{getOperationMeta(item)}</em>
                  </span>
                  <div className="operation-row__actions">
                    <SelectInput
                      aria-label={`Status for ${item.title}`}
                      value={item.status}
                      disabled={savingItemId === item.id}
                      onChange={(event) => handleStatusChange(item, event.target.value as OperationStatus)}
                    >
                      {operationStatuses.map((status) => (
                        <option key={status} value={status}>{formatStatus(status)}</option>
                      ))}
                    </SelectInput>
                    <Button type="button" variant="ghost" onClick={() => openEditForm(item)}>Edit</Button>
                    <Button type="button" variant="ghost" onClick={() => handleDeleteItem(item)} disabled={savingItemId === item.id}>
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-action">
              <EmptyState title="No operation items yet." message="Operational items will appear here when they are added to Supabase." />
              <Button type="button" variant="secondary" onClick={openNewItemForm}>Add First Item</Button>
            </div>
          )}
          <p className="form-note">
            {getSourceNote(operationItemsSource, isPersistenceConfigured)}
          </p>
          {saveMessage ? <p className="form-status form-status--success">{saveMessage}</p> : null}
          {saveError ? <p className="form-status form-status--error">{saveError}</p> : null}
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Branch Metrics" />
          <div className="metrics-grid">
            {metrics.map((metric) => (
              <article className="metric-tile" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </DashboardCard>
        {editorOpen ? (
          <DashboardCard className="span-all">
            <SectionHeader title={isEditing ? "Edit Operation Item" : "Add Operation Item"} />
            <form className="form-grid" aria-label={isEditing ? "Edit operation item" : "Add operation item"} onSubmit={handleSubmit}>
              <FormField label="Title" htmlFor="operation-title">
                <TextInput
                  id="operation-title"
                  value={formState.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Operation item"
                  required
                />
              </FormField>
              <FormField label="Category" htmlFor="operation-category">
                <SelectInput
                  id="operation-category"
                  value={formState.category}
                  onChange={(event) => updateForm("category", event.target.value as OperationCategory)}
                >
                  {operationCategories.map((category) => (
                    <option key={category} value={category}>{formatCategory(category)}</option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Status" htmlFor="operation-status">
                <SelectInput
                  id="operation-status"
                  value={formState.status}
                  onChange={(event) => updateForm("status", event.target.value as OperationStatus)}
                >
                  {operationStatuses.map((status) => (
                    <option key={status} value={status}>{formatStatus(status)}</option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Priority" htmlFor="operation-priority">
                <TextInput
                  id="operation-priority"
                  value={formState.priority}
                  onChange={(event) => updateForm("priority", event.target.value)}
                  placeholder="High, normal, low"
                />
              </FormField>
              <FormField label="Due Date" htmlFor="operation-due-date">
                <DateInput
                  id="operation-due-date"
                  value={formState.dueDate}
                  onChange={(event) => updateForm("dueDate", event.target.value)}
                />
              </FormField>
              <FormField label="Owner" htmlFor="operation-owner">
                <TextInput
                  id="operation-owner"
                  value={formState.owner}
                  onChange={(event) => updateForm("owner", event.target.value)}
                  placeholder="Leadership, media, ride lead"
                />
              </FormField>
              <FormField label="Notes" htmlFor="operation-notes">
                <Textarea
                  id="operation-notes"
                  value={formState.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Context, follow-up, or details the team should remember."
                />
              </FormField>
              <div className="form-actions">
                <Button type="submit" variant="primary" disabled={savingItemId === formState.id || savingItemId === "new"}>
                  {savingItemId === formState.id || savingItemId === "new" ? "Saving..." : "Save item"}
                </Button>
                <Button type="button" variant="ghost" onClick={closeEditor}>Cancel</Button>
                <span className="form-note">
                  {isPersistenceConfigured ? "Saves to Supabase when available." : "Fallback mode: saves stay local to this session."}
                </span>
              </div>
            </form>
          </DashboardCard>
        ) : null}
        <DashboardCard className="span-all">
          <SectionHeader title="Recently Completed" />
          {completedEvents.length > 0 ? (
            <div className="record-list">
              {completedEvents.slice(0, 4).map((event) => (
                <article className="record-row" key={event.id}>
                  <span>
                    <strong>{event.title}</strong>
                    <em>{dateFormatter.format(new Date(`${event.startDate}T00:00:00`))} · {event.type}</em>
                  </span>
                  <StatusChip label="Completed" tone="success" />
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No completed events in the current source" message="Completed events appear here automatically when the shared event source includes past records." />
          )}
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

function toOperationFormState(item: OperationItem): OperationFormState {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    status: item.status,
    priority: item.priority ?? "",
    dueDate: item.dueDate ?? "",
    owner: item.owner ?? "",
    notes: item.notes ?? ""
  };
}

function toOperationInput(form: OperationFormState): OperationItemInput {
  return {
    id: form.id,
    title: form.title.trim(),
    category: form.category,
    status: form.status,
    priority: form.priority.trim() || undefined,
    dueDate: form.dueDate || undefined,
    owner: form.owner.trim() || undefined,
    notes: form.notes.trim() || undefined
  };
}

function getOperationMeta(item: OperationItem) {
  const parts = [
    formatCategory(item.category),
    item.dueDate ? dateFormatter.format(new Date(`${item.dueDate}T00:00:00`)) : "",
    item.owner ?? "",
    item.priority ? `${item.priority} priority` : ""
  ].filter(Boolean);

  return parts.join(" · ");
}

function isUpcomingDeadline(item: OperationItem) {
  if (item.category !== "deadline" || !item.dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${item.dueDate}T00:00:00`);

  return dueDate >= today;
}

function formatCategory(category: string) {
  return category.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatus(status: OperationStatus) {
  return status.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSourceNote(source: "static" | "supabase" | "fallback", isPersistenceConfigured: boolean) {
  if (source === "supabase") return "Live Supabase operations source is active.";
  if (isPersistenceConfigured) return "Showing fallback/demo operation items because the Supabase read failed.";
  return "Fallback mode: using static demo operation items.";
}
