"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { Textarea } from "@wifo/ui/textarea";

type CourtEditField = "name" | "type" | "status" | "description" | "priceInCents" | "imageUrl";

interface CourtBasicInfoFormProps {
  name: string;
  type: "indoor" | "outdoor";
  status: "active" | "maintenance" | "inactive";
  description: string;
  priceInCents: number | null;
  errors: Record<string, string>;
  onChange: (field: CourtEditField, value: string | number | null) => void;
}

export function CourtBasicInfoForm({
  name,
  type,
  status,
  description,
  priceInCents,
  errors,
  onChange,
}: CourtBasicInfoFormProps) {
  const priceInSoles = priceInCents !== null ? priceInCents / 100 : "";

  function handlePriceChange(value: string) {
    if (value === "") {
      onChange("priceInCents", null);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        onChange("priceInCents", Math.round(numValue * 100));
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Información Básica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Court Name */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Nombre de la cancha <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Cancha 1"
              value={name}
              onChange={(e) => onChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de cancha</Label>
            <Select value={type} onValueChange={(value) => onChange("type", value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">🏠 Indoor (Techada)</SelectItem>
                <SelectItem value="outdoor">☀️ Outdoor (Al aire libre)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={(value) => onChange("status", value)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Precio por hora (S/)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="80.00"
              value={priceInSoles}
              onChange={(e) => handlePriceChange(e.target.value)}
              className={errors.priceInCents ? "border-red-500" : ""}
            />
            {errors.priceInCents && (
              <p className="text-sm text-red-500">{errors.priceInCents}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe las características de la cancha, iluminación, superficie, etc."
              value={description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
