"use client";

import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

import type { CourtEditFormValues } from "../edit/_components/court-edit-form";
import { ImageUpload } from "~/components/images/ImageUpload";

interface PhotoSectionProps {
  control: Control<CourtEditFormValues>;
  courtId: string;
}

export function PhotoSection({ control, courtId }: PhotoSectionProps) {
  const { field } = useController({ control, name: "imageUrl" });

  const value = field.value ? [field.value] : [];
  const handleChange = (ids: string[]) => {
    field.onChange(ids[0] ?? "");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Foto de la Cancha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          entityType="court"
          entityId={courtId}
          mode="single"
          value={value}
          onChange={handleChange}
          variant="card"
          aspectRatio="3/2"
        />
      </CardContent>
    </Card>
  );
}
