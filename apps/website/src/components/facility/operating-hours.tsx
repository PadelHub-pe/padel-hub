const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export function OperatingHours({
  hours,
}: {
  hours: OperatingHour[];
}) {
  if (hours.length === 0) return null;

  // Sort by day of week
  const sorted = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div className="space-y-1">
      {sorted.map((hour) => (
        <div
          key={hour.dayOfWeek}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-muted-foreground w-24">
            {DAY_NAMES[hour.dayOfWeek] ?? `Dia ${hour.dayOfWeek}`}
          </span>
          {hour.isClosed ? (
            <span className="text-muted-foreground/60 text-xs">Cerrado</span>
          ) : (
            <span className="font-medium">
              {hour.openTime} - {hour.closeTime}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
