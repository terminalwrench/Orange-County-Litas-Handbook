import { useMemo, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { PreviewModal } from "../components/ui/PreviewModal";
import { SectionHeader } from "../components/ui/SectionHeader";
import { TextInput } from "../components/ui/inputs";
import type { BranchAsset } from "../types";

interface BranchAssetsProps {
  assets: BranchAsset[];
  assetsSource: "static" | "supabase" | "fallback";
}

const categoryLabels: Record<BranchAsset["category"], string> = {
  logos: "Logos",
  "flyer-templates": "Flyer Templates",
  "ride-route-templates": "Ride Route Templates",
  other: "Other"
};

export function BranchAssets({ assets, assetsSource }: BranchAssetsProps) {
  const [searchValue, setSearchValue] = useState("");
  const [previewAsset, setPreviewAsset] = useState<BranchAsset | null>(null);
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredAssets = useMemo(() => {
    if (!normalizedSearch) return assets;

    return assets.filter((asset) => {
      const typeLabel = categoryLabels[asset.category].toLowerCase();
      return asset.title.toLowerCase().includes(normalizedSearch) || typeLabel.includes(normalizedSearch);
    });
  }, [assets, normalizedSearch]);
  const logoCount = assets.filter((asset) => asset.category === "logos").length;
  const templateCount = assets.filter((asset) => asset.category === "flyer-templates" || asset.category === "ride-route-templates").length;
  const lastUpdated = getLatestUpdatedAt(assets);

  return (
    <PageContainer>
      <div className="page-title">
        <span>Branch Assets</span>
        <h1>Official branch branding resources</h1>
      </div>
      <div className="module-grid">
        <DashboardCard className="span-all">
          <div className="metrics-grid metrics-grid--summary">
            <Metric label="Branch Assets" value={String(assets.length)} />
            <Metric label="Logos" value={String(logoCount)} />
            <Metric label="Templates" value={String(templateCount)} />
            <Metric label="Last Updated" value={lastUpdated || "Not set"} />
          </div>
        </DashboardCard>
        <DashboardCard className="span-all">
          <SectionHeader title="Asset Library" />
          <FormField label="Search assets" htmlFor="branch-assets-search">
            <TextInput
              id="branch-assets-search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by title or asset type"
            />
          </FormField>
          {filteredAssets.length > 0 ? (
            <div className="branch-assets-grid">
              {filteredAssets.map((asset) => (
                <article className="branch-asset-card" key={asset.id}>
                  <button
                    type="button"
                    className={`branch-asset-card__preview branch-asset-card__preview--${asset.previewSurface ?? "dark"}`}
                    onClick={() => asset.previewUrl ? setPreviewAsset(asset) : undefined}
                    disabled={!asset.previewUrl}
                    title={asset.previewUrl ? `Preview ${asset.title}` : "No preview asset has been linked yet."}
                  >
                    {asset.previewUrl ? <img src={asset.previewUrl} alt="" /> : <span>No preview</span>}
                  </button>
                  <div className="branch-asset-card__content">
                    <strong>{asset.title}</strong>
                    <em>{categoryLabels[asset.category]}</em>
                    <dl className="media-card__meta">
                      <div>
                        <dt>Last Updated</dt>
                        <dd>{asset.updatedAt || "Not set"}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="branch-asset-card__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setPreviewAsset(asset)}
                      disabled={!asset.previewUrl}
                    >
                      View
                    </Button>
                    <Button type="button" variant="secondary" disabled title="Copy Link will be enabled when share links are configured.">
                      Copy Link
                    </Button>
                    {asset.downloadUrl ? (
                      <a className="button button--secondary" href={asset.downloadUrl} download>
                        Download
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={assets.length > 0 ? "No matching assets" : "No assets added yet"}
              message={assets.length > 0 ? "Try a different asset title or type." : getEmptyAssetMessage(assetsSource)}
            />
          )}
        </DashboardCard>
      </div>
      {previewAsset?.previewUrl ? (
        <PreviewModal
          title={previewAsset.title}
          subtitle={categoryLabels[previewAsset.category]}
          description={previewAsset.description}
          imageUrl={previewAsset.previewUrl}
          updatedAt={previewAsset.updatedAt}
          downloadUrl={previewAsset.downloadUrl}
          onClose={() => setPreviewAsset(null)}
        />
      ) : null}
    </PageContainer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function getLatestUpdatedAt(assets: BranchAsset[]) {
  const sortedDates = assets
    .map((asset) => asset.updatedAt)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return sortedDates[0] ?? "";
}

function getEmptyAssetMessage(source: BranchAssetsProps["assetsSource"]) {
  if (source === "supabase") return "Branch assets will appear here when they are added.";
  return "Flyers, event graphics, logos, templates, and photo links will appear here.";
}
