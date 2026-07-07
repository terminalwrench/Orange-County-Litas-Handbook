import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";
import type { ExternalResource } from "../types";
import { getReferenceSections } from "../services/settingsService";

interface ReferenceProps {
  externalResources: ExternalResource[];
}

export function Reference({ externalResources }: ReferenceProps) {
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
        <DashboardCard className="span-all">
          <SectionHeader title="Operations Playbook" />
          <div className="playbook">
            {referenceSections.map((section) => (
              <section className="playbook-section" key={section.id} id={section.id}>
                <h2>{section.title}</h2>
                {section.items.map((item) => (
                  <div className={item.disabled ? "playbook-block playbook-block--disabled" : "playbook-block"} key={item.id} id={item.id}>
                    <h3>{item.label}</h3>
                    <p>{item.disabled ? `${item.detail} This area will be configured later.` : item.detail}</p>
                    {item.content.length > 0 ? (
                      <ul>
                        {item.content.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </section>
            ))}
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}
