"use client";

import { useState } from "react";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Checkbox } from "@wifo/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@wifo/ui/sheet";

import {
  AMENITIES,
  CORE_OFFERINGS,
  DISTRICT_SLUGS,
  LIMA_DISTRICTS,
} from "~/lib/constants";

const SORT_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "precio-bajo", label: "Precio: menor a mayor" },
  { value: "precio-alto", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre A-Z" },
  { value: "canchas", label: "Mas canchas" },
] as const;

const COURT_TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
] as const;

interface MobileFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDistricts: string[];
  currentType: string;
  currentSort: string;
  currentAmenities: string[];
  currentOfferings: string[];
  currentView: string;
  onApply: (filters: {
    districts: string[];
    type: string;
    sort: string;
    amenities: string[];
    offerings: string[];
    view: string;
  }) => void;
}

export function MobileFiltersSheet({
  open,
  onOpenChange,
  currentDistricts,
  currentType,
  currentSort,
  currentAmenities,
  currentOfferings,
  currentView,
  onApply,
}: MobileFiltersSheetProps) {
  // Local state for batched changes
  const [districts, setDistricts] = useState(currentDistricts);
  const [type, setType] = useState(currentType);
  const [sort, setSort] = useState(currentSort);
  const [amenities, setAmenities] = useState(currentAmenities);
  const [offerings, setOfferings] = useState(currentOfferings);
  const [view, setView] = useState(currentView);

  // Sync local state when sheet opens
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDistricts(currentDistricts);
      setType(currentType);
      setSort(currentSort);
      setAmenities(currentAmenities);
      setOfferings(currentOfferings);
      setView(currentView);
    }
    onOpenChange(nextOpen);
  }

  function toggleDistrict(slug: string) {
    setDistricts((prev) =>
      prev.includes(slug) ? prev.filter((d) => d !== slug) : [...prev, slug],
    );
  }

  function toggleAmenity(key: string) {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  }

  function toggleOffering(key: string) {
    setOfferings((prev) =>
      prev.includes(key) ? prev.filter((o) => o !== key) : [...prev, key],
    );
  }

  function clearAll() {
    setDistricts([]);
    setType("");
    setSort("");
    setAmenities([]);
    setOfferings([]);
  }

  function handleApply() {
    onApply({ districts, type, sort, amenities, offerings, view });
    onOpenChange(false);
  }

  const totalActive =
    districts.length +
    (type ? 1 : 0) +
    (sort ? 1 : 0) +
    amenities.length +
    offerings.length;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85vh] flex-col rounded-t-2xl"
        showCloseButton
      >
        <SheetHeader className="border-border border-b pb-3">
          <SheetTitle className="text-lg">Filtros</SheetTitle>
          <SheetDescription className="sr-only">
            Filtra canchas de padel por distrito, tipo, amenidades y servicios
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {/* Districts */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Distrito</h3>
            <div className="grid grid-cols-2 gap-1">
              {LIMA_DISTRICTS.map((d) => {
                const slug = DISTRICT_SLUGS[d] ?? d.toLowerCase();
                const checked = districts.includes(slug);
                return (
                  <label
                    key={slug}
                    className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleDistrict(slug)}
                    />
                    {d}
                  </label>
                );
              })}
            </div>
          </section>

          {/* Court type */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Tipo de Cancha</h3>
            <div className="flex flex-wrap gap-2">
              {COURT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    type === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Sort */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Ordenar por</h3>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    sort === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* View toggle */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Vista</h3>
            <div className="flex cursor-pointer gap-2">
              <button
                onClick={() => setView("lista")}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  view !== "mapa"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                Lista
              </button>
              <button
                onClick={() => setView("mapa")}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  view === "mapa"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                Mapa
              </button>
            </div>
          </section>

          {/* Amenities */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Amenidades</h3>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(AMENITIES).map(([key, { label, icon }]) => {
                const checked = amenities.includes(key);
                return (
                  <label
                    key={key}
                    className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleAmenity(key)}
                    />
                    <span>{icon}</span>
                    <span className="truncate">{label}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Services */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Servicios</h3>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(CORE_OFFERINGS).map(([key, { label, icon }]) => {
                const checked = offerings.includes(key);
                return (
                  <label
                    key={key}
                    className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleOffering(key)}
                    />
                    <span>{icon}</span>
                    <span className="truncate">{label}</span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div className="border-border flex items-center gap-3 border-t px-4 py-3">
          {totalActive > 0 && (
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={clearAll}
            >
              Limpiar todo
            </Button>
          )}
          <Button variant="secondary" className="ml-auto" onClick={handleApply}>
            Ver resultados
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
