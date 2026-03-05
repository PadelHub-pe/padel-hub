"use client";

import { useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";
import { AddFacilityCard } from "./add-facility-card";
import { FacilitiesFilters } from "./facilities-filters";
import { FacilitiesGrid } from "./facilities-grid";
import { FacilitiesStats } from "./facilities-stats";
import { FacilityEmptyState } from "./facility-empty-state";

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

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [district, setDistrict] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<
    "name" | "bookings" | "revenue" | "utilization"
  >("name");

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

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setDistrict(undefined);
    setSortBy("name");
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
            />
          </div>

          {/* Facilities Grid */}
          <FacilitiesGrid
            facilities={facilities}
            isLoading={false}
            addFacilityCard={<AddFacilityCard />}
            userRole={userRole}
            onReactivate={handleReactivate}
          />
        </>
      )}
    </div>
  );
}
