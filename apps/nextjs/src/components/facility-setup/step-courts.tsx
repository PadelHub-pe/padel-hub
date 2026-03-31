"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import { RadioGroup, RadioGroupItem } from "@wifo/ui/radio-group";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

interface CourtFormData {
  name: string;
  type: "indoor" | "outdoor";
  priceInSoles: string;
  peakPriceInSoles: string;
}

const EMPTY_FORM: CourtFormData = {
  name: "",
  type: "indoor",
  priceInSoles: "",
  peakPriceInSoles: "",
};

const MAX_COURTS = 10;

interface StepCourtsProps {
  facilityId: string;
  onCourtCountChange?: (count: number) => void;
}

export function StepCourts({
  facilityId,
  onCourtCountChange,
}: StepCourtsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CourtFormData>(EMPTY_FORM);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteCourtId, setDeleteCourtId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: courts = [] } = useQuery({
    ...trpc.court.list.queryOptions({ facilityId }),
    select: (data) => {
      // Notify parent of count changes
      onCourtCountChange?.(data.length);
      return data;
    },
  });

  const invalidateCourts = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.court.list.queryOptions({ facilityId }).queryKey,
    });

  const createCourt = useMutation(
    trpc.court.create.mutationOptions({
      onSuccess: () => {
        void invalidateCourts();
        resetForm();
        toast.success("Cancha creada");
      },
      onError: (error) => {
        setFormError(error.message);
      },
    }),
  );

  const updateCourt = useMutation(
    trpc.court.update.mutationOptions({
      onSuccess: () => {
        void invalidateCourts();
        resetForm();
        toast.success("Cancha actualizada");
      },
      onError: (error) => {
        setFormError(error.message);
      },
    }),
  );

  const deleteCourt = useMutation(
    trpc.court.delete.mutationOptions({
      onSuccess: () => {
        void invalidateCourts();
        setDeleteCourtId(null);
        toast.success("Cancha eliminada");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  function resetForm() {
    setFormData(EMPTY_FORM);
    setEditingCourtId(null);
    setShowAddForm(false);
    setFormError(null);
  }

  function handleStartEdit(court: (typeof courts)[number]) {
    setFormData({
      name: court.name,
      type: court.type,
      priceInSoles: court.priceInCents
        ? (court.priceInCents / 100).toString()
        : "",
      peakPriceInSoles: court.peakPriceInCents
        ? (court.peakPriceInCents / 100).toString()
        : "",
    });
    setEditingCourtId(court.id);
    setShowAddForm(true);
    setFormError(null);
  }

  function handleStartAdd() {
    resetForm();
    setShowAddForm(true);
  }

  function validateForm(): boolean {
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError("El nombre es requerido");
      return false;
    }
    if (formData.name.trim().length < 2) {
      setFormError("El nombre debe tener al menos 2 caracteres");
      return false;
    }
    if (!formData.priceInSoles) {
      setFormError("El precio es requerido");
      return false;
    }
    const price = parseFloat(formData.priceInSoles);
    if (isNaN(price) || price < 1) {
      setFormError("El precio debe ser al menos S/ 1.00");
      return false;
    }
    if (formData.peakPriceInSoles) {
      const peakPrice = parseFloat(formData.peakPriceInSoles);
      if (isNaN(peakPrice) || peakPrice < 1) {
        setFormError("El precio hora punta debe ser al menos S/ 1.00");
        return false;
      }
    }
    return true;
  }

  function handleSubmit() {
    if (!validateForm()) return;

    const priceInCents = Math.round(parseFloat(formData.priceInSoles) * 100);
    const peakPriceInCents = formData.peakPriceInSoles
      ? Math.round(parseFloat(formData.peakPriceInSoles) * 100)
      : undefined;

    if (editingCourtId) {
      updateCourt.mutate({
        facilityId,
        id: editingCourtId,
        data: {
          name: formData.name.trim(),
          type: formData.type,
          priceInCents,
          peakPriceInCents,
        },
      });
    } else {
      createCourt.mutate({
        facilityId,
        name: formData.name.trim(),
        type: formData.type,
        priceInCents,
        peakPriceInCents,
      });
    }
  }

  function handleConfirmDelete() {
    if (!deleteCourtId) return;
    deleteCourt.mutate({ facilityId, id: deleteCourtId });
  }

  const isSubmitting = createCourt.isPending || updateCourt.isPending;
  const canAddMore = courts.length < MAX_COURTS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Canchas</h2>
        <p className="mt-1 text-sm text-gray-500">
          Agrega las canchas de padel de tu local con sus precios (máximo{" "}
          {MAX_COURTS}).
        </p>
      </div>

      {/* Court Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courts.map((court) => (
          <div
            key={court.id}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium text-gray-900">
                  {court.name}
                </h3>
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {court.type === "indoor" ? "Techada" : "Al aire libre"}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-gray-900">
                  S/{" "}
                  {court.priceInCents
                    ? (court.priceInCents / 100).toFixed(0)
                    : "—"}
                </span>
                <span className="text-xs text-gray-500">/ turno</span>
              </div>
              {court.peakPriceInCents ? (
                <p className="text-xs text-gray-500">
                  Hora punta: S/ {(court.peakPriceInCents / 100).toFixed(0)}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleStartEdit(court)}
              >
                <PencilIcon className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setDeleteCourtId(court.id)}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add Court Card (only when there are existing courts) */}
        {canAddMore && courts.length > 0 && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
          >
            <PlusIcon className="mb-2 h-8 w-8" />
            <span className="text-sm font-medium">Agregar Cancha</span>
            <span className="mt-1 text-xs">
              {courts.length}/{MAX_COURTS}
            </span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {courts.length === 0 && !showAddForm && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <CourtIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-500">
            Aún no has agregado ninguna cancha.
          </p>
          <Button
            type="button"
            onClick={handleStartAdd}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            Agregar primera cancha
          </Button>
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog
        open={showAddForm}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCourtId ? "Editar Cancha" : "Agregar Cancha"}
            </DialogTitle>
            <DialogDescription>
              {editingCourtId
                ? "Modifica los datos de la cancha."
                : "Completa los datos de la nueva cancha."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {formError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="court-name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="court-name"
                type="text"
                placeholder="Cancha 1"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo de cancha</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as "indoor" | "outdoor",
                  })
                }
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="indoor" id="form-type-indoor" />
                  <Label
                    htmlFor="form-type-indoor"
                    className="cursor-pointer font-normal"
                  >
                    Indoor (techada)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="outdoor" id="form-type-outdoor" />
                  <Label
                    htmlFor="form-type-outdoor"
                    className="cursor-pointer font-normal"
                  >
                    Outdoor (al aire libre)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="court-price">
                Precio por turno (en Soles){" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative max-w-xs">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                  S/
                </span>
                <Input
                  id="court-price"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="80"
                  className="pl-9"
                  value={formData.priceInSoles}
                  onChange={(e) =>
                    setFormData({ ...formData, priceInSoles: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Peak Price (optional) */}
            <div className="space-y-2">
              <Label htmlFor="court-peak-price">
                Precio hora punta (opcional)
              </Label>
              <div className="relative max-w-xs">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                  S/
                </span>
                <Input
                  id="court-peak-price"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="120"
                  className="pl-9"
                  value={formData.peakPriceInSoles}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      peakPriceInSoles: e.target.value,
                    })
                  }
                />
              </div>
              <p className="text-xs text-gray-500">
                Se aplicará durante horarios de hora punta (configurable luego).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <LoadingSpinner />
              ) : editingCourtId ? (
                "Guardar"
              ) : (
                "Agregar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteCourtId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCourtId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cancha</DialogTitle>
            <DialogDescription>
              {courts.length === 1
                ? "Esta es la única cancha. Si la eliminas, deberás agregar al menos una para completar la configuración."
                : "¿Estás seguro de que deseas eliminar esta cancha? Esta acción no se puede deshacer."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCourtId(null)}
              disabled={deleteCourt.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteCourt.isPending}
            >
              {deleteCourt.isPending ? <LoadingSpinner /> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function CourtIcon({ className }: { className?: string }) {
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
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
