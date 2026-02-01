"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";
import { AmenitiesForm } from "./amenities-form";
import { BasicInfoForm } from "./basic-info-form";
import { EditHeader } from "./edit-header";
import { LocationForm } from "./location-form";
import { PhotosForm } from "./photos-form";

interface FacilityEditData {
  name: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  address: {
    street: string;
    district: string;
    city: string;
  };
  amenities: string[];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function FacilityEditForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const { data: profile } = useSuspenseQuery(
    trpc.facility.getProfile.queryOptions(),
  );

  // Initialize form state from server data (useSuspenseQuery guarantees data exists)
  const [formData, setFormData] = useState<FacilityEditData>(() => ({
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    description: profile.description,
    address: {
      street: profile.address.street,
      district: profile.address.district,
      city: profile.address.city,
    },
    amenities: profile.amenities,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useMutation(
    trpc.facility.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.success("Perfil actualizado correctamente");
        router.push("/facility");
      },
      onError: (error) => {
        toast.error(error.message || "Error al guardar los cambios");
      },
    }),
  );

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }
    if (!formData.address.street.trim()) {
      newErrors.street = "La dirección es requerida";
    }
    if (!formData.address.district.trim()) {
      newErrors.district = "El distrito es requerido";
    }
    if (!formData.address.city.trim()) {
      newErrors.city = "La ciudad es requerida";
    }
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = "Correo electrónico inválido";
    }
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "URL inválida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) return;

    updateMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
      description: formData.description,
      address: formData.address,
      amenities: formData.amenities,
    });
  }

  function handleFieldChange(field: string, value: string) {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleAddressChange(field: string, value: string) {
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [field]: value,
      },
    });

    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleAmenitiesChange(amenities: string[]) {
    setFormData({
      ...formData,
      amenities,
    });
  }

  return (
    <div className="p-8">
      <EditHeader isSaving={updateMutation.isPending} onSave={handleSave} />

      <div className="mt-8 space-y-6">
        <BasicInfoForm
          name={formData.name}
          phone={formData.phone}
          email={formData.email}
          website={formData.website}
          description={formData.description}
          errors={errors}
          onChange={handleFieldChange}
        />

        <LocationForm
          street={formData.address.street}
          district={formData.address.district}
          city={formData.address.city}
          errors={errors}
          onChange={handleAddressChange}
        />

        <PhotosForm />

        <AmenitiesForm
          selectedAmenities={formData.amenities}
          onChange={handleAmenitiesChange}
        />
      </div>
    </div>
  );
}
