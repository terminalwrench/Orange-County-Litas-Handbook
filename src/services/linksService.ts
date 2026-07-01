import { usefulLinks } from "../data/links";
import type { ExternalResource } from "../types";

export function getUsefulLinks(): ExternalResource[] {
  return usefulLinks;
}

export function getConfiguredLinks(): ExternalResource[] {
  return getUsefulLinks().filter((link) => Boolean(link.url));
}
