import { mediaItems } from "../data/appData";
import { mediaSources } from "../data/settings";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import type { EventRecord, MediaItem } from "../types";

interface MediaCenterProps {
  eventRecords: EventRecord[];
}

function getMediaStatusTone(status: string) {
  if (status === "Available" || status === "Posted") return "success";
  if (status === "Needs prep") return "warning";
  return "neutral";
}

function getRelatedEvent(item: MediaItem, events: EventRecord[]) {
  if (!item.relatedEventId) return null;
  return events.find((event) => event.id === item.relatedEventId) ?? null;
}

function getAssetActionLabel(type: string) {
  if (type === "logo") return "Preview Asset";
  if (type === "flyer") return "Open Flyer";
  if (type === "photo album") return "Open Album";
  if (type === "template") return "Open Template";
  return "Open Asset";
}

function handleSourceTarget(targetId: string) {
  document.getElementById(targetId)?.scrollIntoView({ block: "start", behavior: "smooth" });
}

export function MediaCenter({ eventRecords }: MediaCenterProps) {
  return (
    <PageContainer>
      <div className="page-title">
        <span>Media Center</span>
        <h1>Flyers, photos, and branch media</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard className="span-all" id="asset-library">
          <SectionHeader title="Asset Library" />
          {mediaItems.length > 0 ? (
            <div className="media-grid">
              {mediaItems.map((item) => {
                const relatedEvent = getRelatedEvent(item, eventRecords);
                const displayDate = item.date ?? relatedEvent?.startDate ?? "No date";

                return (
                  <article className="media-card" key={item.id}>
                    <Icon name={item.type === "logo" ? "image" : "file"} />
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.type}</em>
                    </span>
                    <dl className="media-card__meta">
                      <div>
                        <dt>Related Event</dt>
                        <dd>{relatedEvent?.title ?? "None"}</dd>
                      </div>
                      <div>
                        <dt>Date</dt>
                        <dd>{displayDate}</dd>
                      </div>
                    </dl>
                    <StatusChip label={item.status} tone={getMediaStatusTone(item.status)} />
                    {item.url ? (
                      <a className="button button--secondary media-card__action" href={item.url} target="_blank" rel="noreferrer">
                        {getAssetActionLabel(item.type)}
                      </a>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled
                        className="media-card__action"
                        title="No media file or link has been added yet."
                      >
                        Not Linked Yet
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No assets added yet"
              message="Flyers, event graphics, logos, templates, and photo links will appear here."
            />
          )}
        </DashboardCard>
        <DashboardCard>
          <SectionHeader title="Media Sources" />
          <div className="source-list">
            {mediaSources.map((source) => (
              <article className="source-card" key={source.id}>
                <Icon name={source.icon} />
                <span>
                  <strong>{source.title}</strong>
                  <em>{source.description}</em>
                </span>
                {source.url ? (
                  <a className="button button--secondary" href={source.url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : source.targetId ? (
                  <Button type="button" variant="secondary" onClick={() => handleSourceTarget(source.targetId!)}>
                    View
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" disabled title="This source link has not been configured yet.">
                    Not Configured
                  </Button>
                )}
              </article>
            ))}
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
              <p>Use official source assets only. Do not recreate branch logos.</p>
            </article>
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  );
}
