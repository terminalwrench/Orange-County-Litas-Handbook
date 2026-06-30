import type { Deadline } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { Icon } from "../ui/Icon";
import { SectionHeader } from "../ui/SectionHeader";

interface DeadlinesCardProps {
  deadlines: Deadline[];
}

export function DeadlinesCard({ deadlines }: DeadlinesCardProps) {
  return (
    <DashboardCard className="list-card" ariaLabel="Upcoming deadlines">
      <SectionHeader title="Upcoming Deadlines" />
      <div className="deadline-list">
        {deadlines.map((deadline) => (
          <article className="deadline-list__row" key={deadline.id}>
            <Icon name="calendar" />
            <strong>{deadline.title}</strong>
            <em>{deadline.dueLabel}</em>
          </article>
        ))}
      </div>
      <p className="card-note">Detailed milestone views are not connected yet.</p>
    </DashboardCard>
  );
}
