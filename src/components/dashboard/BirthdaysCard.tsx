import type { Birthday } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { EmptyState } from "../ui/EmptyState";
import { SectionHeader } from "../ui/SectionHeader";

interface BirthdaysCardProps {
  birthdays: Birthday[];
}

export function BirthdaysCard({ birthdays }: BirthdaysCardProps) {
  return (
    <DashboardCard className="birthday-card" ariaLabel="Birthdays this month">
      <SectionHeader title="Current Month Birthdays" />
      {birthdays.length > 0 ? (
        <div className="birthday-list">
          {birthdays.map((birthday) => (
            <article className="birthday-list__row" key={birthday.id}>
              <span className="birthday-initials" aria-hidden="true">{birthday.initials}</span>
              <span>
                <strong>{birthday.name}</strong>
                <em>
                  {birthday.dateLabel}
                  {birthday.instagramHandle ? ` · ${birthday.instagramHandle}` : ""}
                </em>
              </span>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No birthdays this month." />
      )}
    </DashboardCard>
  );
}
