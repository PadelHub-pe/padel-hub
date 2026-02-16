import { Button } from "@wifo/ui/button";

interface BookingsHeaderProps {
  onAddBooking: () => void;
}

export function BookingsHeader({ onAddBooking }: BookingsHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reservas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona todas las reservas de tu local
        </p>
      </div>
      <Button onClick={onAddBooking}>
        <PlusIcon className="h-4 w-4" />
        Agregar Reserva
      </Button>
    </header>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}
