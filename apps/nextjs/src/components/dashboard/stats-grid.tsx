"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { StatCard } from "./stat-card";

interface StatsGridProps {
  facilityId: string;
}

export function StatsGrid({ facilityId }: StatsGridProps) {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.dashboard.getStats.queryOptions({ facilityId }),
  );

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={stats.todayBookings.label}
        value={stats.todayBookings.value}
        change={stats.todayBookings.change}
        iconColor="blue"
        icon={<CalendarIcon className="h-5 w-5" />}
      />
      <StatCard
        title={stats.todayRevenue.label}
        value={stats.todayRevenue.value}
        change={stats.todayRevenue.change}
        iconColor="green"
        prefix="S/ "
        icon={<CurrencyIcon className="h-5 w-5" />}
      />
      <StatCard
        title={stats.pendingBookings.label}
        value={stats.pendingBookings.value}
        iconColor="amber"
        icon={<ClockIcon className="h-5 w-5" />}
      />
      <StatCard
        title={stats.monthlyRevenue.label}
        value={stats.monthlyRevenue.value}
        change={stats.monthlyRevenue.change}
        iconColor="purple"
        prefix="S/ "
        icon={<TrendingIcon className="h-5 w-5" />}
      />
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function TrendingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
      />
    </svg>
  );
}
