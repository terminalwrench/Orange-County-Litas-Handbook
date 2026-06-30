import { referenceSections } from "../data/appData";
import { PageContainer } from "../components/layout/PageContainer";
import { DashboardCard } from "../components/ui/DashboardCard";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";

export function Reference() {
  return (
    <PageContainer>
      <div className="page-title">
        <span>Reference</span>
        <h1>Chapter reference</h1>
      </div>
      <div className="reference-grid">
        {referenceSections.map((section) => (
          <DashboardCard key={section.title}>
            <SectionHeader title={section.title} />
            <p className="muted-copy">{section.description}</p>
            <div className="reference-links">
              {section.links.map((link) => (
                <article key={link.label}>
                  <Icon name="link" />
                  <span>
                    <strong>{link.label}</strong>
                    <em>{link.detail}</em>
                  </span>
                </article>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>
    </PageContainer>
  );
}
