"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@wifo/ui";
import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

import { useTRPC } from "~/trpc/react";

interface CourtViewProps {
  id: string;
}

const statusConfig = {
  active: {
    label: "Activa",
    variant: "success" as const,
    gradient: "from-green-400 to-green-500",
  },
  maintenance: {
    label: "Mantenimiento",
    variant: "warning" as const,
    gradient: "from-amber-400 to-amber-500",
  },
  inactive: {
    label: "Inactiva",
    variant: "destructive" as const,
    gradient: "from-gray-400 to-gray-500",
  },
};

const typeConfig = {
  indoor: { label: "Indoor", description: "Cancha techada", icon: "🏠" },
  outdoor: { label: "Outdoor", description: "Al aire libre", icon: "☀️" },
};

export function CourtView({ id }: CourtViewProps) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const facilityId = params.facilityId as string;
  const trpc = useTRPC();

  const { data: court } = useSuspenseQuery(
    trpc.court.getById.queryOptions({ facilityId, id }),
  );

  const status = statusConfig[court.status];
  const type = typeConfig[court.type];
  const formattedPrice = court.priceInCents
    ? `S/ ${(court.priceInCents / 100).toFixed(2)}`
    : null;
  const formattedPeakPrice = court.peakPriceInCents
    ? `S/ ${(court.peakPriceInCents / 100).toFixed(2)}`
    : null;

  const basePath = `/org/${orgSlug}/facilities/${facilityId}`;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`${basePath}/courts`} className="hover:text-gray-700">
          Canchas
        </Link>
        <span>/</span>
        <span className="text-gray-900">{court.name}</span>
      </nav>

      {/* Header */}
      <header className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{court.name}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <Button asChild>
          <Link href={`${basePath}/courts/${id}/edit`}>
            <PencilIcon className="h-4 w-4" />
            Editar Cancha
          </Link>
        </Button>
      </header>

      {/* Content */}
      <div className="mt-8 space-y-6">
        {/* Image Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Foto de la Cancha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "relative h-48 overflow-hidden rounded-lg bg-gradient-to-br md:h-64",
                court.imageUrl ? "" : status.gradient,
              )}
              style={
                court.imageUrl
                  ? {
                      backgroundImage: `url(${court.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <Badge variant={status.variant} className="absolute top-3 left-3">
                {status.label}
              </Badge>
              <Badge
                variant="secondary"
                className="absolute top-3 right-3 bg-white/90 text-gray-700"
              >
                {type.icon} {type.label}
              </Badge>
              {!court.imageUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/80">
                    <ImageIcon className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-sm">Sin imagen</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Información de la Cancha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoField label="Nombre" value={court.name} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Tipo</p>
                <p className="text-sm text-gray-900">{type.label}</p>
                <p className="text-xs text-gray-500">{type.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoField
                label="Tarifa Estándar"
                value={formattedPrice ? `${formattedPrice}/hr` : "No definido"}
              />
              <InfoField
                label="Tarifa Horario Pico"
                value={
                  formattedPeakPrice
                    ? `${formattedPeakPrice}/hr`
                    : "No definido"
                }
              />
            </div>

            {court.description && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Descripción</p>
                <p className="text-sm text-gray-900">{court.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
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
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}
