import { mediaItems } from "../data/appData";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";

export function MediaCenter() {
  return (
    <PageContainer>
      <div className="page-title">
        <span>Media Center</span>
        <h1>Flyers, photos, and chapter media</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard>
          <SectionHeader title="Media Library" />
          <div className="media-grid">
            {mediaItems.map((item) => (
              <article className="media-card" key={item.id}>
                <Icon name={item.type === "Brand Asset" ? "image" : "file"} />
                <span>
                  <strong>{item.title}</strong>
                  <em>{item.type} · {item.location}</em>
                </span>
                <StatusChip label={item.status} tone={item.status === "Posted" || item.status === "Available" ? "success" : "warning"} />
              </article>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Media Storage" />
          <EmptyState title="Uploads are not connected yet" message="Use this space later for Drive, Canva, or event-media links when the storage workflow is decided." />
          <div className="form-actions">
            <Button type="button" variant="secondary" disabled title="Media link storage is not connected yet.">
              Add media link
            </Button>
          </div>
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Media Operating Notes" />
          <div className="reference-grid">
            <article>
              <strong>Flyers</strong>
              <p>Keep final flyer links with the related event record.</p>
            </article>
            <article>
              <strong>Photos</strong>
              <p>Organize by event date before posting or archiving.</p>
            </article>
            <article>
              <strong>Branding</strong>
              <p>Use official source assets only. Do not recreate chapter logos.</p>
            </article>
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}
