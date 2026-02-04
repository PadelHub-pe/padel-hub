import { cn } from "@wifo/ui";

interface CourtsStatsBarProps {
  stats: {
    total: number;
    active: number;
    maintenance: number;
    todayBookings: number;
  };
}

export function CourtsStatsBar({ stats }: CourtsStatsBarProps) {
  return (
    <div className="flex items-center justify-center gap-12 border-t pt-6">
      <StatItem value={stats.total} label="Total Canchas" color="gray" />
      <StatItem value={stats.active} label="Activas" color="green" />
      <StatItem value={stats.maintenance} label="Mantenimiento" color="amber" />
      <StatItem value={stats.todayBookings} label="Reservas Hoy" color="blue" />
    </div>
  );
}

interface StatItemProps {
  value: number;
  label: string;
  color: "gray" | "green" | "amber" | "blue";
}

const colorClasses = {
  gray: "text-gray-900",
  green: "text-green-600",
  amber: "text-amber-600",
  blue: "text-blue-600",
};

function StatItem({ value, label, color }: StatItemProps) {
  return (
    <div className="flex flex-col items-center">
      <span className={cn("text-2xl font-bold", colorClasses[color])}>
        {value}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
