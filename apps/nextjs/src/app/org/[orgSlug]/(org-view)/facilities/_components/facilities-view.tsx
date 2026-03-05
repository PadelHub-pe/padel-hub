"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";
import { AddFacilityCard } from "./add-facility-card";
import { DeactivateDialog } from "./deactivate-dialog";
import { FacilitiesFilters } from "./facilities-filters";
import { FacilitiesGrid } from "./facilities-grid";
import { FacilitiesStats } from "./facilities-stats";
import { FacilityEmptyState } from "./facility-empty-state";

type StatusFilter = "all" | "active" | "inactive";
type SortBy = "name" | "bookings" | "revenue" | "utilization";

const validStatuses = new Set<StatusFilter>(["all", "active", "inactive"]);
const validSorts = new Set<SortBy>([
  "name",
  "bookings",
  "revenue",
  "utilization",
]);

function parseStatus(value: string | null): StatusFilter {
  return value && validStatuses.has(value as StatusFilter)
    ? (value as StatusFilter)
    : "all";
}

function parseSortBy(value: string | null): SortBy {
  return value && validSorts.has(value as SortBy) ? (value as SortBy) : "name";
}

interface FacilitiesViewProps {
  organizationId: string;
  organizationName: string;
  userRole: "org_admin" | "facility_manager" | "staff";
}

export function FacilitiesView({
  organizationId,
  organizationName,
  userRole,
}: FacilitiesViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const district = searchParams.get("district") ?? undefined;
  const sortBy = parseSortBy(searchParams.get("sort"));

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Remove default values to keep URL clean
      if (params.get("status") === "all") params.delete("status");
      if (params.get("sort") === "name") params.delete("sort");

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : ".", { scroll: false });
    },
    [searchParams, router],
  );

  const setSearch = useCallback(
    (value: string) => updateParams({ q: value || undefined }),
    [updateParams],
  );
  const setStatus = useCallback(
    (value: StatusFilter) =>
      updateParams({ status: value === "all" ? undefined : value }),
    [updateParams],
  );
  const setDistrict = useCallback(
    (value: string | undefined) => updateParams({ district: value }),
    [updateParams],
  );
  const setSortBy = useCallback(
    (value: SortBy) =>
      updateParams({ sort: value === "name" ? undefined : value }),
    [updateParams],
  );

  const { data: stats } = useSuspenseQuery(
    trpc.org.getStats.queryOptions({
      organizationId,
    }),
  );

  const { data: facilities } = useSuspenseQuery(
    trpc.org.getFacilities.queryOptions({
      organizationId,
      search: search || undefined,
      status,
      district,
      sortBy,
    }),
  );

  const { data: districts } = useSuspenseQuery(
    trpc.org.getDistricts.queryOptions({ organizationId }),
  );

  const updateStatus = useMutation(
    trpc.org.updateFacilityStatus.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.org.getFacilities.queryOptions({
            organizationId,
            search: search || undefined,
            status,
            district,
            sortBy,
          }),
        );
        void queryClient.invalidateQueries(
          trpc.org.getStats.queryOptions({ organizationId }),
        );
      },
    }),
  );

  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleClearFilters = () => {
    router.replace(".", { scroll: false });
  };

  const handleDeactivate = (facility: { id: string; name: string }) => {
    setDeactivateTarget(facility);
  };

  const handleConfirmDeactivate = () => {
    if (!deactivateTarget) return;
    updateStatus.mutate(
      { facilityId: deactivateTarget.id, isActive: false },
      {
        onSuccess: () => {
          toast.success(`${deactivateTarget.name} desactivado`);
          setDeactivateTarget(null);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const handleReactivate = (facility: { id: string; name: string }) => {
    updateStatus.mutate(
      { facilityId: facility.id, isActive: true },
      {
        onSuccess: () => {
          toast.success(`${facility.name} reactivado`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Locales</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona los locales de {organizationName}
        </p>
      </div>

      {/* Stats */}
      <FacilitiesStats
        stats={stats}
        isLoading={false}
        suppressTrends={stats.totalFacilities === 0}
      />

      {stats.totalFacilities === 0 ? (
        /* First-time empty state */
        <div className="mt-8">
          <FacilityEmptyState />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mt-8 mb-6">
            <FacilitiesFilters
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
              district={district}
              onDistrictChange={setDistrict}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              districts={districts}
              onClearFilters={handleClearFilters}
              filteredCount={facilities.length}
              totalCount={stats.totalFacilities}
            />
          </div>

          {/* Facilities Grid */}
          <FacilitiesGrid
            facilities={facilities}
            isLoading={false}
            addFacilityCard={<AddFacilityCard />}
            userRole={userRole}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />
        </>
      )}

      {/* Deactivation Confirmation Dialog */}
      <DeactivateDialog
        facility={deactivateTarget}
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        onConfirm={handleConfirmDeactivate}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}
