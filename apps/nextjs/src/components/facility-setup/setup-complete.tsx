"use client";

import Link from "next/link";

import { Button } from "@wifo/ui/button";
import { Card, CardContent } from "@wifo/ui/card";

interface SetupCompleteProps {
  facilityName: string;
  courtCount: number;
  warnings: { type: string; message: string }[];
  dashboardUrl: string;
  photosUrl: string;
  settingsUrl: string;
}

export function SetupComplete({
  facilityName,
  courtCount,
  warnings,
  dashboardUrl,
  photosUrl,
  settingsUrl,
}: SetupCompleteProps) {
  return (
    <div className="space-y-6">
      {/* Celebration */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Tu local está listo!
        </h1>
        <p className="mt-2 text-gray-500">
          {facilityName} ya está activo y listo para recibir reservas.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-gray-900">
            Resumen de configuración
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm">
              <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span className="text-gray-700">
                {courtCount}{" "}
                {courtCount === 1
                  ? "cancha configurada"
                  : "canchas configuradas"}
              </span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span className="text-gray-700">Horarios establecidos</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span className="text-gray-700">Precios asignados</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold text-amber-800">
              Recomendaciones opcionales
            </h2>
            <ul className="space-y-3">
              {warnings.map((warning) => (
                <li
                  key={warning.type}
                  className="flex items-start gap-3 text-sm"
                >
                  <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                  <div>
                    <span className="text-gray-700">{warning.message}</span>
                    {warning.type === "photos" && (
                      <Link
                        href={photosUrl}
                        className="ml-2 font-medium text-blue-600 hover:text-blue-700"
                      >
                        Agregar fotos
                      </Link>
                    )}
                    {warning.type === "amenities" && (
                      <Link
                        href={settingsUrl}
                        className="ml-2 font-medium text-blue-600 hover:text-blue-700"
                      >
                        Configurar
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href={dashboardUrl}>Ir al Dashboard</Link>
        </Button>
        {warnings.some((w) => w.type === "photos") && (
          <Button asChild variant="outline">
            <Link href={photosUrl}>Agregar Fotos</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
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
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
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
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}
