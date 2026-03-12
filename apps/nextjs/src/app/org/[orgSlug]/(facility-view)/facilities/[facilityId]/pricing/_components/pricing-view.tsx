"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { CourtPricingTable } from "./court-pricing-table";
import { PeakPeriodsSection } from "./peak-periods-section";
import { PricingHeader } from "./pricing-header";
import { RateCards } from "./rate-cards";
import { RevenueCalculator } from "./revenue-calculator";
import { WeeklySchedule } from "./weekly-schedule";

export function PricingView() {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();

  const { data } = useSuspenseQuery(
    trpc.pricing.getOverview.queryOptions({ facilityId }),
  );

  return (
    <div className="p-8">
      <PricingHeader />

      <div className="mt-6 space-y-6">
        <RateCards facilityId={facilityId} stats={data.stats} />

        <WeeklySchedule
          operatingHours={data.operatingHours}
          peakPeriods={data.peakPeriods}
          medianRegularCents={data.stats.defaultRegularCents}
          medianPeakCents={data.stats.defaultPeakCents}
        />

        <CourtPricingTable
          courts={data.courts}
          facilityId={facilityId}
          avgMarkupPercent={data.stats.markupPercent}
        />

        <RevenueCalculator />

        <PeakPeriodsSection
          peakPeriods={data.peakPeriods}
          medianPriceCents={data.stats.medianRegularCents}
        />
      </div>
    </div>
  );
}
