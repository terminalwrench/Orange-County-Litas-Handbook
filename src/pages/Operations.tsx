import { operationsChecklist, venueReferences } from "../data/appData";
import { PageContainer } from "../components/layout/PageContainer";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";

export function Operations() {
  return (
    <PageContainer>
      <div className="page-title">
        <span>Operations</span>
        <h1>Chapter operations overview</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Chapter Checklist" />
          <div className="checklist-groups">
            {operationsChecklist.map((group) => (
              <section key={group.title}>
                <h3>{group.title}</h3>
                <ul className="checklist">
                  {group.items.map((item) => (
                    <li key={item}>
                      <Icon name="check" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Internal Reminders" />
          <div className="reminder-list">
            <StatusChip label="Calendar review" tone="accent" />
            <p>Confirm the next 30 to 60 days before announcing public plans.</p>
            <StatusChip label="Venue readiness" tone="neutral" />
            <p>Check parking, capacity, food, restrooms, and reservation needs.</p>
            <StatusChip label="Media archive" tone="neutral" />
            <p>Link final flyers and photos back to the related event record.</p>
          </div>
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Venue & Contact References" />
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Category</th>
                  <th>Last visited</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {venueReferences.map((venue) => (
                  <tr key={venue.name}>
                    <td>{venue.name}</td>
                    <td>{venue.category}</td>
                    <td>{venue.lastVisited}</td>
                    <td>{venue.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Supplies & Prep" />
          <EmptyState title="No supply tracker yet" message="Keep this lightweight until the chapter decides what needs recurring inventory." />
        </DashboardCard>
      </div>
    </PageContainer>
  );
}
