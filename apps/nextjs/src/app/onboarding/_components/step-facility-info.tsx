"use client";

import { Checkbox } from "@wifo/ui/checkbox";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import { Textarea } from "@wifo/ui/textarea";

const AMENITIES = [
  { id: "parking", label: "Estacionamiento" },
  { id: "indoor", label: "Canchas techadas" },
  { id: "outdoor", label: "Canchas al aire libre" },
  { id: "cafe", label: "Cafetería" },
  { id: "showers", label: "Duchas" },
  { id: "lockers", label: "Casilleros" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "pro_shop", label: "Tienda de equipamiento" },
  { id: "lessons", label: "Clases/Entrenamiento" },
  { id: "air_conditioning", label: "Aire acondicionado" },
];

export interface FacilityInfoData {
  name: string;
  description: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  amenities: string[];
}

interface StepFacilityInfoProps {
  data: FacilityInfoData;
  onChange: (data: FacilityInfoData) => void;
  errors: Record<string, string>;
}

export function StepFacilityInfo({
  data,
  onChange,
  errors,
}: StepFacilityInfoProps) {
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  }

  function handleAmenityChange(amenityId: string, checked: boolean) {
    const newAmenities = checked
      ? [...data.amenities, amenityId]
      : data.amenities.filter((id) => id !== amenityId);
    onChange({ ...data, amenities: newAmenities });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Información del Local
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Ingresa los datos básicos de tu centro de padel.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Facility Name */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">
            Nombre del local <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Padel Club Miraflores"
            value={data.name}
            onChange={handleChange}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe tu centro de padel, instalaciones, servicios especiales, etc."
            value={data.description}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {/* Address */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">
            Dirección <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            name="address"
            type="text"
            placeholder="Av. José Pardo 620"
            value={data.address}
            onChange={handleChange}
            className={errors.address ? "border-red-500" : ""}
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address}</p>
          )}
        </div>

        {/* District */}
        <div className="space-y-2">
          <Label htmlFor="district">
            Distrito <span className="text-red-500">*</span>
          </Label>
          <Input
            id="district"
            name="district"
            type="text"
            placeholder="Miraflores"
            value={data.district}
            onChange={handleChange}
            className={errors.district ? "border-red-500" : ""}
          />
          {errors.district && (
            <p className="text-sm text-red-500">{errors.district}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            name="city"
            type="text"
            placeholder="Lima"
            value={data.city}
            onChange={handleChange}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Teléfono del local <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+51 1 234 5678"
            value={data.phone}
            onChange={handleChange}
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
            name="email"
            type="email"
            placeholder="info@miclub.pe"
            value={data.email}
            onChange={handleChange}
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
            name="website"
            type="url"
            placeholder="https://www.miclub.pe"
            value={data.website}
            onChange={handleChange}
            className={errors.website ? "border-red-500" : ""}
          />
          {errors.website && (
            <p className="text-sm text-red-500">{errors.website}</p>
          )}
        </div>

        {/* Amenities */}
        <div className="space-y-3 sm:col-span-2">
          <Label>Servicios y comodidades</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {AMENITIES.map((amenity) => (
              <div key={amenity.id} className="flex items-center gap-2">
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={data.amenities.includes(amenity.id)}
                  onCheckedChange={(checked) =>
                    handleAmenityChange(amenity.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`amenity-${amenity.id}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
