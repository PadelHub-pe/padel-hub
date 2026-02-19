"use client";

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { AddFacilityCard } from "./add-facility-card";
import { FacilitiesFilters } from "./facilities-filters";
import { FacilitiesGrid } from "./facilities-grid";
import { FacilitiesStats } from "./facilities-stats";

interface FacilitiesViewProps {
  organizationId: string;
  organizationName: string;
}

export function FacilitiesView({
  organizationId,
  organizationName,
}: FacilitiesViewProps) {
  const trpc = useTRPC();

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

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setDistrict(undefined);
    setSortBy("name");
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
      <FacilitiesStats stats={stats} isLoading={false} />

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
      />
    </div>
  );
}
