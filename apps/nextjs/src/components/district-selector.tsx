"use client";

import { useCallback, useState } from "react";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@wifo/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@wifo/ui/popover";

const LIMA_DISTRICTS = [
  "Ate",
  "Barranco",
  "Breña",
  "Carabayllo",
  "Chaclacayo",
  "Chorrillos",
  "Cieneguilla",
  "Comas",
  "El Agustino",
  "Independencia",
  "Jesús María",
  "La Molina",
  "La Victoria",
  "Lima Cercado",
  "Lince",
  "Los Olivos",
  "Lurigancho-Chosica",
  "Lurín",
  "Magdalena del Mar",
  "Miraflores",
  "Pachacámac",
  "Pueblo Libre",
  "Puente Piedra",
  "Punta Hermosa",
  "Punta Negra",
  "Rímac",
  "San Bartolo",
  "San Borja",
  "San Isidro",
  "San Juan de Lurigancho",
  "San Juan de Miraflores",
  "San Luis",
  "San Martín de Porres",
  "San Miguel",
  "Santa Anita",
  "Santa María del Mar",
  "Santa Rosa",
  "Santiago de Surco",
  "Surquillo",
  "Villa El Salvador",
  "Villa María del Triunfo",
] as const;

interface DistrictSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export function DistrictSelector({
  value,
  onChange,
  onBlur,
  disabled,
}: DistrictSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSelect = useCallback(
    (district: string) => {
      onChange(district);
      setOpen(false);
      setSearch("");
      // Trigger onBlur so geocoding fires after selection
      setTimeout(() => onBlur?.(), 0);
    },
    [onChange, onBlur],
  );

  const handleUseCustom = useCallback(() => {
    if (search.trim().length >= 2) {
      onChange(search.trim());
      setOpen(false);
      setSearch("");
      setTimeout(() => onBlur?.(), 0);
    }
  }, [search, onChange, onBlur]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">Seleccionar distrito</span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground ml-2 h-4 w-4 shrink-0"
          >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Buscar distrito..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim().length >= 2 ? (
                <button
                  type="button"
                  onClick={handleUseCustom}
                  className="text-primary cursor-pointer underline"
                >
                  Usar &quot;{search.trim()}&quot;
                </button>
              ) : (
                "No se encontró el distrito"
              )}
            </CommandEmpty>
            <CommandGroup>
              {LIMA_DISTRICTS.map((district) => (
                <CommandItem
                  key={district}
                  value={district}
                  onSelect={handleSelect}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === district ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {district}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
