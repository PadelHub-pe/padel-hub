import { Suspense } from "react";
import Link from "next/link";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { DashboardHeader, ScheduleTable, StatsGrid } from "~/components/dashboard";

interface FacilityDashboardPageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
}

export default async function FacilityDashboardPage({ params }: FacilityDashboardPageProps) {
  const { orgSlug, facilityId } = await params;
  const caller = await api();

  // Get facility setup status
  let setupStatus: { isComplete: boolean } | null = null;
  try {
    setupStatus = await caller.facility.getSetupStatus({ facilityId });
  } catch {
    // If we can't get status, assume complete
    setupStatus = { isComplete: true };
  }

  // Prefetch data for client components
  // TODO: Update to accept facilityId for facility-scoped data
  prefetch(trpc.dashboard.getStats.queryOptions());
  prefetch(trpc.dashboard.getTodaySchedule.queryOptions());

  return (
    <HydrateClient>
      <div className="p-8">
        {/* Setup Incomplete Banner */}
        {!setupStatus.isComplete && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <SetupIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-800">
                  Configuración pendiente
                </h3>
                <p className="mt-1 text-sm text-amber-700">
                  Tu local está inactivo. Completa la configuración de canchas y horarios para
                  activarlo y empezar a recibir reservas.
                </p>
                <Link
                  href={`/org/${orgSlug}/facilities/${facilityId}/setup`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Completar configuración
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <DashboardHeader title="Dashboard" />

        <div className="mt-8 space-y-8">
          {/* Stats Cards */}
          <Suspense fallback={<StatsGridSkeleton />}>
            <StatsGrid />
          </Suspense>

          {/* Schedule Table */}
          <Suspense fallback={<ScheduleTableSkeleton />}>
            <ScheduleTable />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl border bg-white" />
      ))}
    </div>
  );
}

function ScheduleTableSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl border bg-white" />;
}

function SetupIcon({ className }: { className?: string }) {
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
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
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
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}
