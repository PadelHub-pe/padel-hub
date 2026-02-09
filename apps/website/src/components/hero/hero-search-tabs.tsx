"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";

import {
  DISTRICT_SLUGS,
  LIMA_DISTRICTS,
  SKILL_CATEGORIES,
} from "~/lib/constants";

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
  const [district, setDistrict] = useState("");
  const [courtType, setCourtType] = useState("");
  const [date, setDate] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (district) {
      const slug = DISTRICT_SLUGS[district];
      if (slug) params.set("distrito", slug);
    }
    if (courtType) params.set("tipo", courtType);
    if (date) params.set("fecha", date);

    const query = params.toString();
    router.push(`/canchas${query ? `?${query}` : ""}`);
  }

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
            Fecha
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Tipo de cancha
          </label>
          <Select value={courtType} onValueChange={setCourtType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
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
