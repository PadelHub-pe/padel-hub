"use client";

import { useState } from "react";
import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import { RadioGroup, RadioGroupItem } from "@wifo/ui/radio-group";

export interface Court {
  id: string;
  name: string;
  type: "indoor" | "outdoor";
}

export interface CourtsData {
  courts: Court[];
}

interface StepCourtsProps {
  data: CourtsData;
  onChange: (data: CourtsData) => void;
  errors: Record<string, string>;
}

export function StepCourts({ data, onChange, errors }: StepCourtsProps) {
  const [newCourt, setNewCourt] = useState<Omit<Court, "id">>({
    name: "",
    type: "indoor",
  });

  function handleAddCourt() {
    if (!newCourt.name.trim()) return;
    if (data.courts.length >= 6) return;

    const court: Court = {
      id: crypto.randomUUID(),
      name: newCourt.name.trim(),
      type: newCourt.type,
    };

    onChange({ courts: [...data.courts, court] });
    setNewCourt({ name: "", type: "indoor" });
  }

  function handleRemoveCourt(id: string) {
    onChange({ courts: data.courts.filter((c) => c.id !== id) });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCourt();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Canchas</h2>
        <p className="mt-1 text-sm text-gray-500">
          Agrega las canchas de padel de tu local (máximo 6).
        </p>
      </div>

      {/* Add Court Form */}
      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Court Name */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="courtName">Nombre de la cancha</Label>
              <Input
                id="courtName"
                type="text"
                placeholder="Cancha 1"
                value={newCourt.name}
                onChange={(e) =>
                  setNewCourt({ ...newCourt, name: e.target.value })
                }
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Add Button */}
            <Button
              type="button"
              onClick={handleAddCourt}
              disabled={!newCourt.name.trim() || data.courts.length >= 6}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Agregar
            </Button>
          </div>

          {/* Court Type */}
          <div className="space-y-2">
            <Label>Tipo de cancha</Label>
            <RadioGroup
              value={newCourt.type}
              onValueChange={(value) =>
                setNewCourt({ ...newCourt, type: value as "indoor" | "outdoor" })
              }
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="indoor" id="type-indoor" />
                <Label htmlFor="type-indoor" className="cursor-pointer font-normal">
                  Indoor (techada)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="outdoor" id="type-outdoor" />
                <Label htmlFor="type-outdoor" className="cursor-pointer font-normal">
                  Outdoor (al aire libre)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errors.courts && (
        <p className="text-sm text-red-500">{errors.courts}</p>
      )}

      {/* Courts List */}
      {data.courts.length > 0 ? (
        <div className="space-y-3">
          <Label>Canchas agregadas ({data.courts.length}/6)</Label>
          <div className="space-y-2">
            {data.courts.map((court, index) => (
              <div
                key={court.id}
                className="flex items-center justify-between rounded-lg border bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{court.name}</p>
                    <p className="text-sm text-gray-500">
                      {court.type === "indoor" ? "Techada" : "Al aire libre"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCourt(court.id)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <CourtIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-500">
            Aún no has agregado ninguna cancha.
            <br />
            Usa el formulario de arriba para agregar al menos una.
          </p>
        </div>
      )}
    </div>
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
