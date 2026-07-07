import { branchAssets } from "../data/branchAssets";
import type { BranchAsset, BranchAssetCategory, BranchAssetPreviewSurface } from "../types";
import { getPersistenceClient, warnAndUseFallback } from "./persistence";

interface SupabaseBranchAssetRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  preview_url: string | null;
  download_url: string | null;
  preview_surface: string | null;
  updated_at: string | null;
}

export interface BranchAssetLoadResult {
  assets: BranchAsset[];
  source: "static" | "supabase" | "fallback";
}

export function getBranchAssets(): BranchAsset[] {
  return branchAssets;
}

export async function loadBranchAssets(): Promise<BranchAssetLoadResult> {
  const supabase = getPersistenceClient();

  if (!supabase) {
    return {
      assets: getBranchAssets(),
      source: "static"
    };
  }

  const { data, error } = await supabase
    .from("branch_assets")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    warnAndUseFallback("Unable to load branch assets from Supabase. Falling back to packaged branch assets.", error);
    return {
      assets: getBranchAssets(),
      source: "fallback"
    };
  }

  return {
    assets: (data as SupabaseBranchAssetRow[]).map(fromSupabaseBranchAsset),
    source: "supabase"
  };
}

function fromSupabaseBranchAsset(row: SupabaseBranchAssetRow): BranchAsset {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: toBranchAssetCategory(row.category),
    previewUrl: row.preview_url ?? undefined,
    downloadUrl: row.download_url ?? undefined,
    updatedAt: toDateOnly(row.updated_at),
    previewSurface: toPreviewSurface(row.preview_surface)
  };
}

function toBranchAssetCategory(value: string): BranchAssetCategory {
  if (value === "flyer-templates" || value === "ride-route-templates" || value === "other") return value;
  return "logos";
}

function toPreviewSurface(value: string | null): BranchAssetPreviewSurface | undefined {
  if (value === "light" || value === "dark") return value;
  return undefined;
}

function toDateOnly(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}
