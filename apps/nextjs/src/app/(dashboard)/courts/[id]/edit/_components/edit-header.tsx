"use client";

import Link from "next/link";

import { Button } from "@wifo/ui/button";

interface EditHeaderProps {
  courtId: string;
  courtName: string;
  isSaving: boolean;
  onSave: () => void;
}

export function EditHeader({
  courtId,
  courtName,
  isSaving,
  onSave,
}: EditHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/courts/${courtId}`}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Editar {courtName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Actualiza la información de la cancha
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/courts/${courtId}`}>Cancelar</Link>
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </header>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
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
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}
