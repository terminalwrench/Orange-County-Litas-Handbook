import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import type { EventRecord, IconName, StatusTone } from "../types";
import { getPastEvents, getUpcomingEvents } from "../services/eventsService";
import { getBirthdays } from "../services/birthdaysService";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

const founderRotation = [
  { monthIndex: 6, month: "July", founder: "Jessica M" },
  { monthIndex: 7, month: "August", founder: "Jessica H" },
  { monthIndex: 8, month: "September", founder: "Aly" }
];

interface OperationsProps {
  eventRecords: EventRecord[];
  isLoading: boolean;
  onOpenEvents: () => void;
  onOpenRidePlanner: () => void;
}

export function Operations({ eventRecords, isLoading, onOpenEvents, onOpenRidePlanner }: OperationsProps) {
  const today = new Date();
  const upcomingEvents = getUpcomingEvents(eventRecords, today);
  const pastEvents = getPastEvents(eventRecords, today);
  const completedEvents = getCompletedEvents(eventRecords, pastEvents);
  const cancelledEvents = eventRecords.filter((event) => event.status === "Cancelled");
  const metrics = buildBranchMetrics(eventRecords, upcomingEvents, completedEvents, cancelledEvents);
  const statusRows = [
    { label: "Planning", count: eventRecords.filter((event) => event.status === "Planning").length, tone: "warning" as StatusTone },
    { label: "Ready", count: eventRecords.filter((event) => event.status === "Ready").length, tone: "success" as StatusTone },
    { label: "Completed", count: completedEvents.length, tone: "success" as StatusTone },
    { label: "Cancelled", count: cancelledEvents.length, tone: "neutral" as StatusTone }
  ];

  return (
    <PageContainer>
      <div className="page-title">
        <span>Operations</span>
        <h1>Branch operations overview</h1>
      </div>
      <div className="module-grid">
        <DashboardCard className="span-all">
          <SectionHeader title="Branch Metrics" />
          <div className="metrics-grid metrics-grid--operations">
            {metrics.map((metric) => (
              <article className="metric-tile" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Operational Status" />
          {isLoading ? (
            <EmptyState title="Loading event status" message="Checking the shared event source." />
          ) : (
            <div className="operation-list">
              {statusRows.map((row) => (
                <button className="operation-row operation-status-row" type="button" key={row.label} onClick={onOpenEvents}>
                  <span>
                    <strong>{row.label}</strong>
                    <em>{row.count} {row.count === 1 ? "event" : "events"}</em>
                  </span>
                  <StatusChip label={row.label} tone={row.tone} />
                </button>
              ))}
            </div>
          )}
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Quick Actions" />
          <div className="source-list source-list--compact">
            <QuickAction
              icon="calendar"
              title="Add Event"
              buttonLabel="Open Events"
              onClick={onOpenEvents}
            />
            <QuickAction
              icon="route"
              title="Add Ride"
              buttonLabel="Open Ride Planner"
              onClick={onOpenRidePlanner}
            />
          </div>
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Recently Completed" />
          {completedEvents.length > 0 ? (
            <div className="record-list">
              {completedEvents.slice(0, 4).map((event) => (
                <button className="record-row operation-history-row" type="button" key={event.id} onClick={onOpenEvents}>
                  <span>
                    <strong>{event.title}</strong>
                    <em>{formatEventDate(event)} · {formatEventType(event)}</em>
                  </span>
                  <StatusChip label="Completed" tone="success" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No completed events in the current source" message="Completed events appear here when event records are marked completed or pass their event date." />
          )}
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Founder Month" />
          <div className="record-list">
            {founderRotation.map((rotation) => {
              const isCurrentMonth = rotation.monthIndex === today.getMonth();

              return (
                <article className={isCurrentMonth ? "record-row operation-founder-row record-row--selected" : "record-row operation-founder-row"} key={rotation.month}>
                  <span>
                    <strong>{rotation.month}</strong>
                    <em>{rotation.founder}</em>
                  </span>
                  {isCurrentMonth ? <StatusChip label="Current" tone="accent" /> : null}
                </article>
              );
            })}
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

function QuickAction({
  icon,
  title,
  buttonLabel,
  onClick
}: {
  icon: IconName;
  title: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <article className="source-card">
      <Icon name={icon} />
      <span>
        <strong>{title}</strong>
      </span>
      <Button type="button" variant="secondary" onClick={onClick}>{buttonLabel}</Button>
    </article>
  );
}

function buildBranchMetrics(
  events: EventRecord[],
  upcomingEvents: EventRecord[],
  completedEvents: EventRecord[],
  cancelledEvents: EventRecord[]
) {
  const members = getBirthdays();

  return [
    { label: "Total Members", value: members.length },
    { label: "Active Members", value: members.length },
    { label: "Total Events", value: events.length },
    { label: "Total Rides", value: events.filter(isRideEvent).length },
    { label: "Total Meet & Greets", value: events.filter(isMeetAndGreetEvent).length },
    { label: "Total Collaborations", value: events.filter(isCollaborationEvent).length },
    { label: "Total Major Events", value: events.filter(isMajorEvent).length },
    { label: "Upcoming Events", value: upcomingEvents.length },
    { label: "Completed Events", value: completedEvents.length },
    { label: "Cancelled Events", value: cancelledEvents.length }
  ];
}

function getCompletedEvents(events: EventRecord[], pastEvents: EventRecord[]) {
  const completedIds = new Set(events.filter((event) => event.status === "Completed").map((event) => event.id));
  const completed = [
    ...events.filter((event) => event.status === "Completed"),
    ...pastEvents.filter((event) => !completedIds.has(event.id) && event.status !== "Cancelled")
  ];

  return completed.sort((a, b) => new Date(`${b.startDate}T00:00:00`).getTime() - new Date(`${a.startDate}T00:00:00`).getTime());
}

function isRideEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("ride") && !isMajorEvent(event);
}

function isMeetAndGreetEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("meet") || text.includes("greet");
}

function isCollaborationEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("collaboration") || text.includes("community") || text.includes("chapter");
}

function isMajorEvent(event: EventRecord) {
  const text = `${event.title} ${event.type}`.toLowerCase();
  return text.includes("major") || text.includes("special") || text.includes("babes") || text.includes("born free") || text.includes("anniversary") || text.includes("poker");
}

function formatEventType(event: EventRecord) {
  if (isMajorEvent(event)) return "Major Event";
  if (isRideEvent(event)) return "Ride";
  if (isMeetAndGreetEvent(event)) return "Meet & Greet";
  if (isCollaborationEvent(event)) return "Collaboration";
  return event.type;
}

function formatEventDate(event: EventRecord) {
  return dateFormatter.format(new Date(`${event.startDate}T00:00:00`));
}
