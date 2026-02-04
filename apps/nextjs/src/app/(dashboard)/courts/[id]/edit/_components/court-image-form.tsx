"use client";

import { cn } from "@wifo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

interface CourtImageFormProps {
  imageUrl: string;
  errors: Record<string, string>;
  onChange: (value: string) => void;
}

export function CourtImageForm({
  imageUrl,
  errors,
  onChange,
}: CourtImageFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Imagen de la Cancha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Preview */}
        <div
          className={cn(
            "relative h-48 overflow-hidden rounded-lg border-2 border-dashed",
            imageUrl ? "border-transparent" : "border-gray-300 bg-gray-50",
          )}
        >
          {imageUrl ? (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <ImageIcon className="h-12 w-12" />
              <p className="mt-2 text-sm">Vista previa de la imagen</p>
            </div>
          )}
        </div>

        {/* Image URL Input */}
        <div className="space-y-2">
          <Label htmlFor="imageUrl">URL de la imagen</Label>
          <Input
            id="imageUrl"
            type="url"
            placeholder="https://ejemplo.com/imagen-cancha.jpg"
            value={imageUrl}
            onChange={(e) => onChange(e.target.value)}
            className={errors.imageUrl ? "border-red-500" : ""}
          />
          {errors.imageUrl && (
            <p className="text-sm text-red-500">{errors.imageUrl}</p>
          )}
          <p className="text-xs text-gray-500">
            Ingresa la URL de una imagen para mostrar en la tarjeta de la cancha
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ImageIcon({ className }: { className?: string }) {
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
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}
