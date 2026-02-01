"use client";

import Link from "next/link";

import { Button } from "@wifo/ui/button";

interface EditHeaderProps {
  isSaving: boolean;
  onSave: () => void;
}

export function EditHeader({ isSaving, onSave }: EditHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Editar Perfil del Local
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Actualiza la información de tu local
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/facility">Cancelar</Link>
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </header>
  );
}
