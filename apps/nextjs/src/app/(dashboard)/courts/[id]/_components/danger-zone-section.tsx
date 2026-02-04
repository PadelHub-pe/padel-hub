"use client";

import { useState } from "react";

import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

interface DangerZoneSectionProps {
  courtName: string;
  isDeleting: boolean;
  onDelete: () => void;
}

export function DangerZoneSection({
  courtName,
  isDeleting,
  onDelete,
}: DangerZoneSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText === courtName;

  function handleDeleteClick() {
    if (showConfirm && canDelete) {
      onDelete();
    } else {
      setShowConfirm(true);
    }
  }

  function handleCancel() {
    setShowConfirm(false);
    setConfirmText("");
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-red-600">
          Zona de Peligro
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showConfirm ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">
                <strong>Advertencia:</strong> Esta acción no se puede deshacer.
                Esto eliminará permanentemente la cancha y cancelará todas las
                reservas futuras asociadas.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmDelete">
                Escribe <strong>{courtName}</strong> para confirmar
              </Label>
              <Input
                id="confirmDelete"
                type="text"
                placeholder={courtName}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="border-red-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={!canDelete || isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar Cancha"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Eliminar esta cancha</p>
              <p className="text-sm text-gray-500">
                Una vez eliminada, todos los datos asociados serán removidos permanentemente.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteClick}>
              Eliminar Cancha
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
