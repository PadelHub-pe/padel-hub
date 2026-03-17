"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useBreadcrumbEntity } from "./breadcrumb-context";

/** Map URL segments to Spanish labels */
const SEGMENT_LABELS: Record<string, string> = {
  facilities: "Locales",
  courts: "Canchas",
  bookings: "Reservas",
  calendar: "Calendario",
  schedule: "Horarios",
  pricing: "Tarifas",
  settings: "Configuración",
  setup: "Configuración Inicial",
  new: "Nuevo",
  edit: "Editar",
};

/** Segments that map to "settings" but with a different label in org-view */
const ORG_SEGMENT_LABELS: Record<string, string> = {
  settings: "Organización",
};

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  orgName: string;
  orgSlug: string;
  facilityName?: string;
  facilityId?: string;
  userRole: "org_admin" | "facility_manager" | "staff";
}

/**
 * Builds breadcrumb items from the current URL path and context.
 *
 * Org-view paths:
 *   /org/[slug]/facilities       → [OrgName > Locales]
 *   /org/[slug]/facilities/new   → [OrgName > Locales > Nuevo]
 *   /org/[slug]/settings         → [OrgName > Organización]
 *
 * Facility-view paths:
 *   /org/[slug]/facilities/[id]                    → [OrgName > FacilityName > Dashboard]
 *   /org/[slug]/facilities/[id]/courts             → [OrgName > FacilityName > Canchas]
 *   /org/[slug]/facilities/[id]/courts/[cid]       → [OrgName > FacilityName > Canchas > {CourtName}]
 *   /org/[slug]/facilities/[id]/courts/[cid]/edit  → [OrgName > FacilityName > Canchas > {CourtName} > Editar]
 *   /org/[slug]/facilities/[id]/bookings/[bid]     → [OrgName > FacilityName > Reservas > {BookingCode}]
 *   /org/[slug]/facilities/[id]/bookings/calendar  → [OrgName > FacilityName > Reservas > Calendario]
 *
 * Staff: org segment is omitted.
 */
function buildBreadcrumbs(
  pathname: string,
  orgName: string,
  orgSlug: string,
  facilityName: string | undefined,
  facilityId: string | undefined,
  userRole: string,
  entityLabel: string | null,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  const isStaff = userRole === "staff";
  const orgBasePath = `/org/${orgSlug}`;

  // Org segment (not shown for staff)
  if (!isStaff) {
    items.push({
      label: orgName,
      href: `${orgBasePath}/facilities`,
    });
  }

  // Determine if we're in facility-view or org-view
  const isFacilityView = facilityName && facilityId;
  const facilityBasePath = `${orgBasePath}/facilities/${facilityId}`;

  if (isFacilityView) {
    // Facility name segment
    items.push({
      label: facilityName,
      href: facilityBasePath,
    });

    // Parse segments after facility base path
    const subPath = pathname.slice(facilityBasePath.length);
    const segments = subPath.split("/").filter(Boolean);

    if (segments.length === 0) {
      // Facility root = Dashboard
      items.push({ label: "Dashboard" });
    } else {
      // Build segments step by step
      let currentPath = facilityBasePath;

      for (const [i, segment] of segments.entries()) {
        const isLast = i === segments.length - 1;
        const knownLabel = SEGMENT_LABELS[segment];

        if (knownLabel) {
          // Known page segment (courts, bookings, etc.)
          currentPath += `/${segment}`;
          items.push(
            isLast
              ? { label: knownLabel }
              : { label: knownLabel, href: currentPath },
          );
        } else {
          // Dynamic segment (entity ID like courtId, bookingId)
          currentPath += `/${segment}`;
          const label = entityLabel ?? "…";
          items.push(isLast ? { label } : { label, href: currentPath });
        }
      }
    }
  } else {
    // Org-view: parse segments after org base path
    const subPath = pathname.slice(orgBasePath.length);
    const segments = subPath.split("/").filter(Boolean);
    let currentPath = orgBasePath;

    for (const [i, segment] of segments.entries()) {
      const isLast = i === segments.length - 1;
      const label =
        ORG_SEGMENT_LABELS[segment] ?? SEGMENT_LABELS[segment] ?? segment;
      currentPath += `/${segment}`;
      items.push(isLast ? { label } : { label, href: currentPath });
    }
  }

  return items;
}

export function Breadcrumbs({
  orgName,
  orgSlug,
  facilityName,
  facilityId,
  userRole,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const { entityLabel } = useBreadcrumbEntity();

  const items = buildBreadcrumbs(
    pathname,
    orgName,
    orgSlug,
    facilityName,
    facilityId,
    userRole,
    entityLabel,
  );

  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-8 pt-6 pb-0">
      {/* Desktop: show all items */}
      <ol className="hidden items-center gap-1.5 text-sm sm:flex">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            )}
            {index === items.length - 1 || !item.href ? (
              <span className="font-medium text-gray-900">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 transition-colors hover:text-gray-700"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {/* Mobile: show ellipsis + last 2 segments */}
      <ol className="flex items-center gap-1.5 text-sm sm:hidden">
        {items.length > 2 && (
          <li className="flex items-center gap-1.5">
            <span className="text-gray-400">…</span>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          </li>
        )}
        {items.slice(-2).map((item, index, arr) => {
          const isLast = index === arr.length - 1;
          const isFirst = index === 0;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {!isFirst && (
                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              )}
              {isLast || !item.href ? (
                <span className="max-w-[200px] truncate font-medium text-gray-900">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="max-w-[150px] truncate text-gray-500 transition-colors hover:text-gray-700"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}
