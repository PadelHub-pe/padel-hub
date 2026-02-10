"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Checkbox } from "@wifo/ui/checkbox";
import { Input } from "@wifo/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@wifo/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";

import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import {
  DISTRICT_SLUGS,
  LIMA_DISTRICTS,
  SKILL_CATEGORIES,
} from "~/lib/constants";
import { formatDistrictName } from "~/lib/format";

const TIMEZONE = "America/Lima";

/** Today in YYYY-MM-DD for the HTML date input `min` attribute */
function getTodayString(): string {
  return format(toZonedTime(new Date(), TIMEZONE), "yyyy-MM-dd");
}

type Tab = "cancha" | "partido";

export function HeroSearchTabs({
  onTabChange,
}: {
  onTabChange?: (tab: Tab) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("cancha");

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    onTabChange?.(tab);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Tab headers */}
      <div className="relative flex rounded-t-xl bg-white">
        {/* Animated sliding background indicator */}
        <div
          className={cn(
            "absolute top-1 bottom-1 z-0 w-1/2 rounded-lg transition-transform duration-300 ease-in-out",
            activeTab === "cancha" ? "bg-secondary/10" : "bg-primary/10",
          )}
          style={{
            transform:
              activeTab === "cancha" ? "translateX(0%)" : "translateX(100%)",
          }}
        />

        <button
          type="button"
          onClick={() => switchTab("cancha")}
          className="relative z-10 flex flex-1 cursor-pointer flex-col items-center rounded-tl-xl px-6 py-4 pb-3 text-sm font-semibold transition-colors"
        >
          <span
            className={cn(
              "transition-colors duration-200",
              activeTab === "cancha"
                ? "text-secondary"
                : "text-muted-foreground",
            )}
          >
            Buscar Cancha
          </span>
          {/* Active underline */}
          <div
            className={cn(
              "bg-secondary mt-1.5 h-0.5 rounded-full transition-all duration-300",
              activeTab === "cancha" ? "w-2/3 opacity-100" : "w-0 opacity-0",
            )}
          />
        </button>

        <button
          type="button"
          onClick={() => switchTab("partido")}
          className="relative z-10 flex flex-1 cursor-pointer flex-col items-center rounded-tr-xl px-6 pt-4 pb-3 text-sm font-semibold transition-colors"
        >
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "transition-colors duration-200",
                activeTab === "partido"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              Buscar Partido
            </span>
            <span
              className={cn(
                "absolute -top-1 right-1 inline-flex rounded-full px-2 py-0.5 text-[7px] font-bold uppercase lg:block lg:text-[10px]",
                activeTab === "partido"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Pronto
            </span>
          </span>
          {/* Active underline */}
          <div
            className={cn(
              "bg-primary mt-1.5 h-0.5 rounded-full transition-all duration-300",
              activeTab === "partido" ? "w-2/3 opacity-100" : "w-0 opacity-0",
            )}
          />
        </button>
      </div>

      {/* Tab content */}
      <div className="rounded-b-xl bg-white px-6 pt-3 pb-6 shadow-lg">
        {activeTab === "cancha" ? <SearchCourtForm /> : <SearchMatchForm />}
      </div>
    </div>
  );
}

function SearchCourtForm() {
  const router = useRouter();
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [courtType, setCourtType] = useState("");
  const [date, setDate] = useState("");

  function toggleDistrict(slug: string) {
    setSelectedDistricts((prev) =>
      prev.includes(slug) ? prev.filter((d) => d !== slug) : [...prev, slug],
    );
  }

  function handleSearch() {
    const params = new URLSearchParams();
    if (selectedDistricts.length > 0) {
      params.set("distrito", selectedDistricts.join(","));
    }
    if (courtType) params.set("tipo", courtType);
    if (date) params.set("fecha", date);

    const query = params.toString();
    router.push(`/canchas${query ? `?${query}` : ""}`);
  }

  const districtLabel =
    selectedDistricts.length === 0
      ? "Todos los distritos"
      : selectedDistricts.length === 1
        ? formatDistrictName(selectedDistricts[0]!)
        : `${selectedDistricts.length} distritos`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Distrito
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal"
              >
                <span className="truncate">{districtLabel}</span>
                <svg
                  className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="max-h-64 overflow-y-auto">
                {LIMA_DISTRICTS.map((d) => {
                  const slug = DISTRICT_SLUGS[d] ?? d.toLowerCase();
                  const checked = selectedDistricts.includes(slug);
                  return (
                    <label
                      key={slug}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
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
              {selectedDistricts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full text-xs"
                  onClick={() => setSelectedDistricts([])}
                >
                  Limpiar
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Fecha
          </label>
          <Input
            type="date"
            value={date}
            min={getTodayString()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Tipo de cancha
          </label>
          <Select
            value={courtType || "all"}
            onValueChange={(v) => setCourtType(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="indoor">Indoor</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        variant="secondary"
        size="lg"
        className="w-full"
      >
        Buscar Canchas
      </Button>
    </div>
  );
}

function SearchMatchForm() {
  const [district, setDistrict] = useState("");
  const [skill, setSkill] = useState("");
  const [date, setDate] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Distrito
          </label>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos los distritos" />
            </SelectTrigger>
            <SelectContent>
              {LIMA_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Nivel
          </label>
          <Select value={skill} onValueChange={setSkill}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas las categorias" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Fecha
          </label>
          <Input
            type="date"
            value={date}
            min={getTodayString()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {!showWaitlist ? (
        <Button
          onClick={() => setShowWaitlist(true)}
          size="lg"
          className="w-full"
        >
          Buscar Partidos
        </Button>
      ) : (
        <div className="border-primary/20 bg-primary/5 rounded-lg border p-4 text-center">
          <p className="text-primary mb-1 text-sm font-semibold">
            Proximamente
          </p>
          <p className="text-muted-foreground mb-3 text-xs">
            Estamos trabajando en esta funcionalidad. Unete a la lista de espera
            para ser el primero en enterarte.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/waitlist">Unirme a la Lista de Espera</a>
          </Button>
        </div>
      )}
    </div>
  );
}
