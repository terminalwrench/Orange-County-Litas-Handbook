import type { Birthday } from "../../types";
import { DashboardCard } from "../ui/DashboardCard";
import { EmptyState } from "../ui/EmptyState";
import { SectionHeader } from "../ui/SectionHeader";

interface BirthdaysCardProps {
  birthdays: Birthday[];
}

export function BirthdaysCard({ birthdays }: BirthdaysCardProps) {
  return (
    <DashboardCard className="birthday-card" ariaLabel="Upcoming birthdays">
      <SectionHeader title="Upcoming Birthdays" />
      {birthdays.length > 0 ? (
        <div className="birthday-list">
          {birthdays.map((birthday) => (
            <article className="birthday-list__row" key={birthday.id}>
              <span className="birthday-initials" aria-hidden="true">{birthday.initials}</span>
              <span>
                <strong>{birthday.name}</strong>
                <em>{birthday.dateLabel}</em>
              </span>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No birthdays this month" message="Birthdays from future months stay hidden until that month begins." />
      )}
      <p className="card-note">Birthday source is static until member records are connected.</p>
    </DashboardCard>
  );
}
