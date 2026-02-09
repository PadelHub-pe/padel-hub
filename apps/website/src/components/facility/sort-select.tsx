"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio-bajo", label: "Precio: menor a mayor" },
  { value: "precio-alto", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre A-Z" },
  { value: "canchas", label: "Mas canchas" },
] as const;

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("orden") ?? "";

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "relevancia") {
      params.set("orden", value);
    } else {
      params.delete("orden");
    }
    router.push(`/canchas?${params.toString()}`);
  }

  return (
    <Select value={currentSort || "relevancia"} onValueChange={handleSort}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder="Ordenar por" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
