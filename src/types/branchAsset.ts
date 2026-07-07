export type BranchAssetCategory = "logos" | "flyer-templates" | "ride-route-templates" | "other";
export type BranchAssetPreviewSurface = "dark" | "light";

export interface BranchAsset {
  id: string;
  title: string;
  description: string;
  category: BranchAssetCategory;
  previewUrl?: string;
  downloadUrl?: string;
  updatedAt: string;
  previewSurface?: BranchAssetPreviewSurface;
}
