"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import { Textarea } from "@wifo/ui/textarea";

interface BasicInfoFormProps {
  name: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function BasicInfoForm({
  name,
  phone,
  email,
  website,
  description,
  errors,
  onChange,
}: BasicInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Información Básica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Facility Name */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Nombre del local <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Padel Club Miraflores"
              value={name}
              onChange={(e) => onChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Teléfono del local <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+51 1 234 5678"
              value={phone}
              onChange={(e) => onChange("phone", e.target.value)}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="info@miclub.pe"
              value={email}
              onChange={(e) => onChange("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.miclub.pe"
              value={website}
              onChange={(e) => onChange("website", e.target.value)}
              className={errors.website ? "border-red-500" : ""}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe tu centro de padel, instalaciones, servicios especiales, etc."
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
