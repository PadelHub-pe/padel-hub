"use client";

import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { cn } from "@wifo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { FormField, FormItem, FormMessage } from "@wifo/ui/form";

import type { CourtEditFormValues } from "../edit/_components/court-edit-form";

interface CourtTypeSectionProps {
  control: Control<CourtEditFormValues>;
}

const courtTypes = [
  {
    value: "indoor" as const,
    label: "Indoor",
    description: "Cancha techada",
    icon: "\u{1F3E0}",
  },
  {
    value: "outdoor" as const,
    label: "Outdoor",
    description: "Al aire libre",
    icon: "\u{2600}\u{FE0F}",
  },
];

export function CourtTypeSection({ control }: CourtTypeSectionProps) {
  const type = useWatch({ control, name: "type" });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Tipo de Cancha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-2 gap-4">
                {courtTypes.map((courtType) => (
                  <button
                    key={courtType.value}
                    type="button"
                    onClick={() => field.onChange(courtType.value)}
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
                        type === courtType.value
                          ? "text-primary"
                          : "text-gray-900",
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
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
