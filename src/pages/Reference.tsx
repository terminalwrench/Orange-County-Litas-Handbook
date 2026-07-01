import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";
import { getUsefulLinks } from "../services/linksService";
import { getReferenceSections } from "../services/settingsService";

export function Reference() {
  const externalResources = getUsefulLinks();
  const referenceSections = getReferenceSections();

  return (
    <PageContainer>
      <div className="page-title">
        <span>Reference</span>
        <h1>Branch reference</h1>
      </div>
      <div className="reference-grid">
        <DashboardCard key="useful-links" id="useful-links" className="span-all">
          <SectionHeader title="Useful Links" />
          <div className="useful-links-grid">
            {externalResources.map((resource) => (
              <article className="useful-link-card" key={resource.id}>
                <Icon name={resource.icon} />
                <span>
                  <strong>{resource.title}</strong>
                  <em>{resource.description}</em>
                </span>
                {resource.url ? (
                  <a className="button button--secondary" href={resource.url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  <Button type="button" variant="secondary" disabled title="This link has not been configured yet.">
                    Open
                  </Button>
                )}
              </article>
            ))}
          </div>
        </DashboardCard>
        {referenceSections.map((section) => (
          <DashboardCard key={section.id} id={section.id}>
            <SectionHeader title={section.title} />
            <p className="muted-copy">{section.description}</p>
            <div className="reference-links">
              {section.items.map((item) =>
                item.disabled ? (
                  <div className="reference-item reference-item--disabled" key={item.id} id={item.id} aria-disabled="true">
                    <Icon name="link" />
                    <span>
                      <strong>{item.label}</strong>
                      <em>{item.detail}</em>
                    </span>
                  </div>
                ) : (
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
                )
              )}
            </div>
          </DashboardCard>
        ))}
      </div>
    </PageContainer>
  );
}
