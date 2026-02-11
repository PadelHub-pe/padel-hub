"use client";

import { useParams } from "next/navigation";

/**
 * Hook to extract facility context from URL params
 *
 * Used in facility-scoped pages to get:
 * - orgSlug: Organization slug from URL
 * - facilityId: Facility ID from URL
 * - basePath: Base path for navigation within the facility
 *
 * @example
 * ```tsx
 * const { facilityId, basePath } = useFacilityContext();
 *
 * // Use facilityId in tRPC calls
 * const { data } = trpc.booking.list.useQuery({ facilityId, page: 1 });
 *
 * // Use basePath for navigation
 * <Link href={`${basePath}/courts`}>Courts</Link>
 * ```
 */
export function useFacilityContext() {
  const params = useParams();

  const orgSlug = params.orgSlug as string;
  const facilityId = params.facilityId as string;

  return {
    orgSlug,
    facilityId,
    basePath: `/org/${orgSlug}/facilities/${facilityId}`,
  };
}

/**
 * Hook to extract organization context from URL params
 *
 * Used in org-scoped pages (like facilities list) to get:
 * - orgSlug: Organization slug from URL
 * - basePath: Base path for navigation within the organization
 */
export function useOrgContext() {
  const params = useParams();

  const orgSlug = params.orgSlug as string;

  return {
    orgSlug,
    basePath: `/org/${orgSlug}`,
  };
}
