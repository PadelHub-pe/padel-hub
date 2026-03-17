/** Pages that can be preserved when switching facilities */
const PRESERVABLE_SEGMENTS = new Set([
  "bookings",
  "courts",
  "schedule",
  "pricing",
  "settings",
]);

/** Sub-pages that should be fully preserved (not collapsed to parent) */
const PRESERVABLE_SUB_PAGES = new Set(["bookings/calendar"]);

/**
 * Compute the target path when switching between facilities.
 * - Preserves the current page segment (e.g., /bookings, /courts)
 * - Collapses detail pages to list pages (e.g., /courts/[id] → /courts)
 * - Navigates to facility root for non-preservable pages (e.g., /setup)
 */
export function getFacilitySwitchPath(
  currentPathname: string,
  basePath: string,
  currentFacilityId: string,
  newFacilityId: string,
): string {
  const currentFacilityPath = `${basePath}/${currentFacilityId}`;

  const relativePath = currentPathname.startsWith(currentFacilityPath)
    ? currentPathname.slice(currentFacilityPath.length)
    : "";

  const segments = relativePath.replace(/^\//, "").split("/").filter(Boolean);

  const firstSegment = segments[0];
  if (!firstSegment || !PRESERVABLE_SEGMENTS.has(firstSegment)) {
    return `${basePath}/${newFacilityId}`;
  }

  if (segments.length >= 2) {
    const subPage = `${firstSegment}/${segments[1]}`;
    if (PRESERVABLE_SUB_PAGES.has(subPage)) {
      return `${basePath}/${newFacilityId}/${subPage}`;
    }
    return `${basePath}/${newFacilityId}/${firstSegment}`;
  }

  return `${basePath}/${newFacilityId}/${firstSegment}`;
}
