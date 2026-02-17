"use client";

interface RateCardsProps {
  stats: {
    medianRegularCents: number;
    medianPeakCents: number;
    avgMarkupPercent: number;
    regularHoursPercent: number;
    peakHoursPercent: number;
  };
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(0);
}

export function RateCards({ stats }: RateCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Regular Rate Card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white p-6">
        <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-emerald-50" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <span className="text-2xl">&#9728;&#65039;</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Horario Regular
              </h3>
              <p className="text-sm text-gray-500">Tarifa estandar</p>
            </div>
          </div>

          <div className="mb-4 flex items-baseline gap-1">
            <span className="text-sm text-gray-500">S/</span>
            <span className="text-5xl font-extrabold text-gray-900">
              {formatCents(stats.medianRegularCents)}
            </span>
            <span className="text-lg text-gray-500">/hora</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckIcon />
              <span>Horarios fuera de hora pico</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckIcon />
              <span>Tarifa base por cancha</span>
            </div>
          </div>

          <div className="mt-4 border-t border-emerald-100 pt-4">
            <p className="text-xs text-gray-500">
              ~{stats.regularHoursPercent}% de horas semanales
            </p>
            <div className="mt-1 h-2 w-full rounded-full bg-emerald-100">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${stats.regularHoursPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Peak Rate Card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-amber-100/50" />
        <div className="absolute right-3 top-3">
          <span className="rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
            PICO
          </span>
        </div>
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-200">
              <span className="text-2xl">&#9889;</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Hora Pico</h3>
              <p className="text-sm text-amber-700">Tarifa alta demanda</p>
            </div>
          </div>

          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-sm text-gray-500">S/</span>
            <span className="text-5xl font-extrabold text-gray-900">
              {formatCents(stats.medianPeakCents)}
            </span>
            <span className="text-lg text-gray-500">/hora</span>
          </div>

          {stats.avgMarkupPercent > 0 && (
            <div className="mb-4 inline-flex items-center gap-1 rounded-lg bg-amber-200 px-2 py-1">
              <svg
                className="h-4 w-4 text-amber-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <span className="text-sm font-bold text-amber-800">
                +{stats.avgMarkupPercent}% incremento
              </span>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <CheckIcon />
              <span>Periodos de alta demanda</span>
            </div>
            <div className="flex items-center gap-2 text-amber-800">
              <CheckIcon />
              <span>Fines de semana y noches</span>
            </div>
          </div>

          <div className="mt-4 border-t border-amber-200 pt-4">
            <p className="text-xs text-gray-500">
              ~{stats.peakHoursPercent}% de horas semanales
            </p>
            <div className="mt-1 h-2 w-full rounded-full bg-amber-100">
              <div
                className="h-2 rounded-full bg-amber-500"
                style={{ width: `${stats.peakHoursPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
