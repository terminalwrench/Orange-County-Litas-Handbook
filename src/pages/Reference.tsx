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
          <DashboardCard key={section.id} id={section.id}>
            <SectionHeader title={section.title} />
            <p className="muted-copy">{section.description}</p>
            <div className="reference-links">
              {section.items.map((item) => (
                <details className="reference-item" key={item.id} id={item.id}>
                  <summary>
                    <Icon name="link" />
                    <span>
                      <strong>{item.label}</strong>
                      <em>{item.detail}</em>
                    </span>
                  </summary>
                  <ul>
                    {item.content.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>
    </PageContainer>
  );
}
