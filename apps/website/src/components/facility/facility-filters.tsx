"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Checkbox } from "@wifo/ui/checkbox";

import {
  AMENITIES,
  CORE_OFFERINGS,
  DISTRICT_SLUGS,
  LIMA_DISTRICTS,
} from "~/lib/constants";
import { formatDistrictName } from "~/lib/format";
import { FilterDropdown } from "./filter-dropdown";
import { MobileFiltersSheet } from "./mobile-filters-sheet";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio-bajo", label: "Precio: menor a mayor" },
  { value: "precio-alto", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre A-Z" },
  { value: "canchas", label: "Mas canchas" },
] as const;

export function FacilityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Read current state from URL
  const currentDistricts =
    searchParams.get("distrito")?.split(",").filter(Boolean) ?? [];
  const currentType = searchParams.get("tipo") ?? "";
  const currentSort = searchParams.get("orden") ?? "";
  const currentAmenities =
    searchParams.get("amenidades")?.split(",").filter(Boolean) ?? [];
  const currentOfferings =
    searchParams.get("servicios")?.split(",").filter(Boolean) ?? [];
  const currentView = searchParams.get("vista") ?? "lista";

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("pagina");
    router.push(`/canchas?${params.toString()}`);
  }

  function updateMultipleFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("pagina");
    router.push(`/canchas?${params.toString()}`);
  }

  function toggleDistrict(slug: string) {
    const updated = currentDistricts.includes(slug)
      ? currentDistricts.filter((d) => d !== slug)
      : [...currentDistricts, slug];
    updateFilter("distrito", updated.join(","));
  }

  function removeDistrict(slug: string) {
    const updated = currentDistricts.filter((d) => d !== slug);
    updateFilter("distrito", updated.join(","));
  }

  function toggleAmenity(key: string) {
    const updated = currentAmenities.includes(key)
      ? currentAmenities.filter((a) => a !== key)
      : [...currentAmenities, key];
    updateFilter("amenidades", updated.join(","));
  }

  function toggleOffering(key: string) {
    const updated = currentOfferings.includes(key)
      ? currentOfferings.filter((o) => o !== key)
      : [...currentOfferings, key];
    updateFilter("servicios", updated.join(","));
  }

  function toggleView() {
    updateFilter("vista", currentView === "mapa" ? "" : "mapa");
  }

  function clearFilters() {
    router.push("/canchas");
  }

  // Counts
  const totalFilterCount =
    currentDistricts.length +
    (currentType ? 1 : 0) +
    (currentSort ? 1 : 0) +
    currentAmenities.length +
    currentOfferings.length;

  // Mobile sheet apply handler
  function handleMobileApply(filters: {
    districts: string[];
    type: string;
    sort: string;
    amenities: string[];
    offerings: string[];
    view: string;
  }) {
    updateMultipleFilters({
      distrito: filters.districts.join(","),
      tipo: filters.type,
      orden: filters.sort,
      amenidades: filters.amenities.join(","),
      servicios: filters.offerings.join(","),
      vista: filters.view === "mapa" ? "mapa" : "",
    });
  }

  return (
    <div className="mb-6 space-y-3">
      {/* ── Desktop filter bar ──────────────────────────────────────── */}
      <div className="bg-background hidden items-center gap-2 rounded-xl p-2 md:flex">
        {/* District multi-select dropdown */}
        <FilterDropdown
          label="Distrito"
          activeCount={currentDistricts.length}
          onClear={() => updateFilter("distrito", "")}
          contentClassName="w-56"
        >
          <div className="space-y-0.5">
            {LIMA_DISTRICTS.map((d) => {
              const slug = DISTRICT_SLUGS[d] ?? d.toLowerCase();
              const checked = currentDistricts.includes(slug);
              return (
                <label
                  key={slug}
                  className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
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
        </FilterDropdown>

        {/* Court type dropdown */}
        <FilterDropdown
          label={
            currentType
              ? currentType === "indoor"
                ? "Indoor"
                : "Outdoor"
              : "Tipo"
          }
          activeCount={currentType ? 1 : 0}
          onClear={() => updateFilter("tipo", "")}
          contentClassName="w-48"
        >
          <div className="space-y-0.5">
            {[
              { value: "", label: "Todos los tipos" },
              { value: "indoor", label: "Indoor" },
              { value: "outdoor", label: "Outdoor" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter("tipo", opt.value)}
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  currentType === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Sort dropdown */}
        {/* <FilterDropdown
          label={
            currentSort
              ? (SORT_OPTIONS.find((o) => o.value === currentSort)?.label ??
                "Ordenar")
              : "Ordenar"
          }
          activeCount={currentSort ? 1 : 0}
          onClear={() => updateFilter("orden", "")}
          contentClassName="w-56"
        >
          <div className="space-y-0.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  updateFilter(
                    "orden",
                    opt.value === "relevancia" ? "" : opt.value,
                  )
                }
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  (currentSort || "relevancia") === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FilterDropdown> */}

        {/* Amenities dropdown */}
        <FilterDropdown
          label="Amenidades"
          activeCount={currentAmenities.length}
          onClear={() => updateFilter("amenidades", "")}
          contentClassName="w-72"
        >
          <div className="space-y-0.5">
            {Object.entries(AMENITIES).map(([key, { label, icon }]) => {
              const checked = currentAmenities.includes(key);
              return (
                <label
                  key={key}
                  className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleAmenity(key)}
                  />
                  <span className="shrink-0">{icon}</span>
                  <span className="truncate">{label}</span>
                </label>
              );
            })}
          </div>
        </FilterDropdown>

        {/* Services dropdown */}
        <FilterDropdown
          label="Servicios"
          activeCount={currentOfferings.length}
          onClear={() => updateFilter("servicios", "")}
          contentClassName="w-72"
        >
          <div className="space-y-0.5">
            {Object.entries(CORE_OFFERINGS).map(([key, { label, icon }]) => {
              const checked = currentOfferings.includes(key);
              return (
                <label
                  key={key}
                  className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOffering(key)}
                  />
                  <span className="shrink-0">{icon}</span>
                  <span className="truncate">{label}</span>
                </label>
              );
            })}
          </div>
        </FilterDropdown>

        {/* Spacer to push view toggle right */}
        <div className="flex-1" />

        {/* Clear all */}
        {totalFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground shrink-0 text-xs"
          >
            {/* X icon */}
            <svg
              className="mr-1 h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Limpiar
          </Button>
        )}

        {/* View toggle */}
        <div className="bg-muted inline-flex shrink-0 items-center rounded-lg p-1">
          <button
            onClick={() => currentView !== "lista" && toggleView()}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              currentView !== "mapa"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
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
            onClick={() => currentView !== "mapa" && toggleView()}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              currentView === "mapa"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
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
      </div>

      {/* ── Mobile filter bar ───────────────────────────────────────── */}
      <div className="bg-background flex flex-col items-center gap-2 rounded-xl p-2 md:hidden">
        <div className="mb-2 flex w-full items-center gap-2 rounded-xl">
          {/* District dropdown (shown on mobile too) */}
          <FilterDropdown
            label="Distrito"
            activeCount={currentDistricts.length}
            onClear={() => updateFilter("distrito", "")}
            className="flex-1"
            contentClassName="w-56"
          >
            <div className="space-y-0.5">
              {LIMA_DISTRICTS.map((d) => {
                const slug = DISTRICT_SLUGS[d] ?? d.toLowerCase();
                const checked = currentDistricts.includes(slug);
                return (
                  <label
                    key={slug}
                    className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
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
          </FilterDropdown>

          {/* Filtros button → opens sheet */}
          <button
            onClick={() => setMobileOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              totalFilterCount > 0
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {/* Sliders icon */}
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
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            <span>Filtros</span>
            {totalFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold">
                {totalFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* View toggle (compact on mobile) */}
        <div className="bg-muted inline-flex shrink-0 items-center rounded-lg p-1">
          <button
            onClick={() => currentView !== "lista" && toggleView()}
            className={cn(
              "inline-flex items-center rounded-md p-1.5 transition-colors",
              currentView !== "mapa"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
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
            <span className="mx-2 text-sm">Lista</span>
          </button>
          <button
            onClick={() => currentView !== "mapa" && toggleView()}
            className={cn(
              "inline-flex items-center rounded-md p-1.5 transition-colors",
              currentView === "mapa"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
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
            <span className="mx-2 text-sm">Mapa</span>
          </button>
        </div>
      </div>

      {/* ── Selected district pills ─────────────────────────────────── */}
      {currentDistricts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentDistricts.map((slug) => (
            <span
              key={slug}
              className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full border py-1 pr-1.5 pl-2.5 text-xs font-medium"
            >
              {formatDistrictName(slug)}
              <button
                onClick={() => removeDistrict(slug)}
                className="hover:bg-primary/20 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
          {currentDistricts.length > 1 && (
            <button
              onClick={() => updateFilter("distrito", "")}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Limpiar distritos
            </button>
          )}
        </div>
      )}

      {/* ── Mobile filters sheet ────────────────────────────────────── */}
      <MobileFiltersSheet
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        currentDistricts={currentDistricts}
        currentType={currentType}
        currentSort={currentSort}
        currentAmenities={currentAmenities}
        currentOfferings={currentOfferings}
        currentView={currentView}
        onApply={handleMobileApply}
      />
    </div>
  );
}
