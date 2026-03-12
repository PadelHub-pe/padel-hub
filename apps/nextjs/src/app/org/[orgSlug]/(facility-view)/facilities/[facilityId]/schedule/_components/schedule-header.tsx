import { Button } from "@wifo/ui/button";

interface ScheduleHeaderProps {
  onBlockTime?: () => void;
}

export function ScheduleHeader({ onBlockTime }: ScheduleHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Horarios y Disponibilidad
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura los horarios de operacion y periodos pico de tu instalacion
        </p>
      </div>
      {onBlockTime && (
        <Button variant="outline" onClick={onBlockTime}>
          <BlockIcon className="mr-2 h-4 w-4" />
          Bloquear Horario
        </Button>
      )}
    </div>
  );
}

function BlockIcon({ className }: { className?: string }) {
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
        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}
