import { StatCard } from "~/components/dashboard";

interface FacilitiesStatsProps {
  stats:
    | {
        totalFacilities: number;
        activeFacilities: number;
        totalCourts: number;
        monthBookings: number;
        monthRevenue: number;
        monthBookingsTrend: number;
        monthRevenueTrend: number;
      }
    | undefined;
  isLoading: boolean;
}

export function FacilitiesStats({ stats, isLoading }: FacilitiesStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Locales Activos"
        value={`${stats.activeFacilities}/${stats.totalFacilities}`}
        icon={<FacilitiesIcon className="h-5 w-5" />}
        iconColor="blue"
      />
      <StatCard
        title="Canchas Totales"
        value={stats.totalCourts}
        icon={<CourtsIcon className="h-5 w-5" />}
        iconColor="green"
      />
      <StatCard
        title="Reservas del Mes"
        value={stats.monthBookings}
        change={stats.monthBookingsTrend}
        icon={<BookingsIcon className="h-5 w-5" />}
        iconColor="amber"
      />
      <StatCard
        title="Ingresos del Mes"
        value={(stats.monthRevenue / 100).toLocaleString("es-PE", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        prefix="S/ "
        change={stats.monthRevenueTrend}
        icon={<RevenueIcon className="h-5 w-5" />}
        iconColor="purple"
      />
    </div>
  );
}

function FacilitiesIcon({ className }: { className?: string }) {
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
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function CourtsIcon({ className }: { className?: string }) {
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
        d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM12 3.75v16.5M3.75 12h16.5"
      />
    </svg>
  );
}

function BookingsIcon({ className }: { className?: string }) {
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

function RevenueIcon({ className }: { className?: string }) {
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
