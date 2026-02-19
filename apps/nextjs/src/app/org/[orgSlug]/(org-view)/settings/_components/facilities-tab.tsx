"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";

import { useTRPC } from "~/trpc/react";

interface FacilitiesTabProps {
  organizationId: string;
  orgSlug: string;
}

export function FacilitiesTab({ organizationId, orgSlug }: FacilitiesTabProps) {
  const trpc = useTRPC();

  const { data: facilities } = useSuspenseQuery(
    trpc.org.getFacilities.queryOptions({
      organizationId,
      status: "all",
      sortBy: "name",
    }),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Locales</h2>
          <p className="mt-1 text-sm text-gray-500">
            Vista general de todos los locales de la organización
          </p>
        </div>
        <Button asChild>
          <Link href={`/org/${orgSlug}/facilities/new`}>Agregar Local</Link>
        </Button>
      </div>

      {facilities.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">No hay locales registrados</p>
            <Button asChild variant="link" className="mt-2">
              <Link href={`/org/${orgSlug}/facilities/new`}>
                Crear tu primer local
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Link
              key={facility.id}
              href={`/org/${orgSlug}/facilities/${facility.id}`}
              className="group rounded-lg border bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
                  {facility.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                      {facility.name}
                    </h3>
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${facility.isActive ? "bg-green-500" : "bg-gray-300"}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{facility.district}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-normal">
                  {facility.courtCount} canchas
                </Badge>
                {!facility.isSetupComplete && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-xs text-amber-700"
                  >
                    Pendiente
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
