import type { BranchAsset } from "../types";
import { assets } from "./assets";

export const branchAssets: BranchAsset[] = [
  {
    id: "official-oc-litas-full-white-logo",
    title: "Official OC Litas Full White Logo",
    description: "Primary white Orange County Litas logo for dark backgrounds and internal branch materials.",
    category: "logos",
    previewUrl: assets.logos.fullWhite,
    downloadUrl: assets.logos.fullWhite,
    updatedAt: "2026-07-07",
    previewSurface: "dark"
  },
  {
    id: "official-oc-litas-white-fill-logo",
    title: "Official OC Litas White Fill Logo",
    description: "White-fill Orange County Litas logo variation for dark surfaces and event graphics.",
    category: "logos",
    previewUrl: assets.logos.whiteFill,
    downloadUrl: assets.logos.whiteFill,
    updatedAt: "2026-07-07",
    previewSurface: "dark"
  },
  {
    id: "official-litas-script-white-logo",
    title: "Official Litas Script Logo",
    description: "Official white script mark for approved branch use where the script logo is appropriate.",
    category: "logos",
    previewUrl: assets.logos.scriptWhite,
    downloadUrl: assets.logos.scriptWhite,
    updatedAt: "2026-07-07",
    previewSurface: "dark"
  }
];
