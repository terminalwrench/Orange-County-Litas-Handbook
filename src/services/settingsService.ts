import {
  appSettings,
  branchSettings,
  navItems,
  referenceSections
} from "../data/settings";
import { assets } from "../data/assets";
import { featureFlags } from "../data/featureFlags";
import type {
  AppSettings,
  BranchSettings,
  NavItem,
  ReferenceSection
} from "../types";

export function getAppSettings(): AppSettings {
  return appSettings;
}

export function getBranchSettings(): BranchSettings {
  return branchSettings;
}

export function getNavItems(): NavItem[] {
  return navItems;
}

export function getReferenceSections(): ReferenceSection[] {
  return referenceSections;
}

export function getFeatureFlags() {
  return featureFlags;
}

export function getSidebarLogo() {
  return assets.sidebarLogo;
}
