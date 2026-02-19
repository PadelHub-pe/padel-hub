"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { CourtsGrid } from "./courts-grid";
import { CourtsHeader } from "./courts-header";
import { CourtsStatsBar } from "./courts-stats-bar";

export function CourtsView() {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();

  const { data: courts } = useSuspenseQuery(
    trpc.court.list.queryOptions({ facilityId }),
  );
  const { data: stats } = useSuspenseQuery(
    trpc.court.getStats.queryOptions({ facilityId }),
  );

  return (
    <div className="p-8">
      <CourtsHeader />

      <div className="mt-8">
        <CourtsGrid courts={courts} />
      </div>

      <div className="mt-8">
        <CourtsStatsBar stats={stats} />
      </div>
    </div>
  );
}
