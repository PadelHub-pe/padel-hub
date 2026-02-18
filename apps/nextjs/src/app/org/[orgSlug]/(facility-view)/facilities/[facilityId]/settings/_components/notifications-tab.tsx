"use client";

import { Badge } from "@wifo/ui/badge";

const NOTIFICATION_ROWS = [
  { label: "Nuevas Reservas", description: "Cuando un cliente reserva una cancha" },
  { label: "Cancelaciones", description: "Cuando un cliente cancela su reserva" },
  { label: "Resumen Diario", description: "Resumen de actividad del día anterior" },
  {
    label: "Alertas de Baja Ocupación",
    description: "Cuando la ocupación cae debajo del 30%",
  },
];

export function NotificationsTab() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <BellIcon className="h-5 w-5 text-gray-400" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Notificaciones
            </h2>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Configura cómo y cuándo recibir notificaciones
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-gray-100 px-5 py-3 text-xs font-medium text-gray-500">
          <span>Notificación</span>
          <span className="w-16 text-center">Email</span>
          <span className="w-16 text-center">Push</span>
        </div>

        {NOTIFICATION_ROWS.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-b-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-700">{row.label}</p>
              <p className="text-xs text-gray-400">{row.description}</p>
            </div>
            <div className="flex w-16 justify-center">
              <input
                type="checkbox"
                disabled
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-primary-500 disabled:opacity-50"
              />
            </div>
            <div className="flex w-16 justify-center">
              <input
                type="checkbox"
                disabled
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-primary-500 disabled:opacity-50"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
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
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}
