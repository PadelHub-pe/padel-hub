"use client";

import { cn } from "@wifo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

interface CourtTypeSectionProps {
  type: "indoor" | "outdoor";
  onChange: (type: "indoor" | "outdoor") => void;
}

const courtTypes = [
  {
    value: "indoor" as const,
    label: "Indoor",
    description: "Cancha techada",
    icon: "🏠",
  },
  {
    value: "outdoor" as const,
    label: "Outdoor",
    description: "Al aire libre",
    icon: "☀️",
  },
];

export function CourtTypeSection({ type, onChange }: CourtTypeSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Tipo de Cancha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {courtTypes.map((courtType) => (
            <button
              key={courtType.value}
              type="button"
              onClick={() => onChange(courtType.value)}
              className={cn(
                "flex flex-col items-center rounded-lg border-2 p-4 transition-all",
                type === courtType.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50",
              )}
            >
              <span className="text-3xl">{courtType.icon}</span>
              <span
                className={cn(
                  "mt-2 font-medium",
                  type === courtType.value ? "text-primary" : "text-gray-900",
                )}
              >
                {courtType.label}
              </span>
              <span className="mt-0.5 text-xs text-gray-500">
                {courtType.description}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
