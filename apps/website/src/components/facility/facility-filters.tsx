"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@wifo/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { Input } from "@wifo/ui/input";

import { LIMA_DISTRICTS, DISTRICT_SLUGS } from "~/lib/constants";

export function FacilityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentDistrict = searchParams.get("distrito") ?? "";
  const currentType = searchParams.get("tipo") ?? "";
  const currentSearch = searchParams.get("search") ?? "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to first page on filter change
    params.delete("pagina");
    router.push(`/canchas?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/canchas");
  }

  const hasFilters = currentDistrict || currentType || currentSearch;

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Buscar canchas..."
            defaultValue={currentSearch}
            onChange={(_e) => {
              // Debounce would be ideal here, but for now update on blur
            }}
            onBlur={(e) => updateFilter("search", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilter("search", e.currentTarget.value);
              }
            }}
          />
        </div>

        <Select
          value={currentDistrict}
          onValueChange={(value) => updateFilter("distrito", value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Distrito" />
          </SelectTrigger>
          <SelectContent>
            {LIMA_DISTRICTS.map((d) => (
              <SelectItem key={d} value={DISTRICT_SLUGS[d] ?? d.toLowerCase()}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentType}
          onValueChange={(value) => updateFilter("tipo", value)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="indoor">Indoor</SelectItem>
            <SelectItem value="outdoor">Outdoor</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-sm">
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
