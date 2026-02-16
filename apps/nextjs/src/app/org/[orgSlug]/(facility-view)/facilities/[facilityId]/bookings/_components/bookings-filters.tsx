"use client";

import { useEffect, useState } from "react";
import { parse } from "date-fns";
import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";

interface Court {
  id: string;
  name: string;
}

interface BookingsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  courtId: string | undefined;
  onCourtChange: (value: string | undefined) => void;
  status: string | undefined;
  onStatusChange: (value: string | undefined) => void;
  date: Date | undefined;
  onDateChange: (value: Date | undefined) => void;
  courts: Court[];
  onClearFilters: () => void;
}

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "in_progress", label: "En Progreso" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "open_match", label: "Partido Abierto" },
];

export function BookingsFilters({
  search,
  onSearchChange,
  courtId,
  onCourtChange,
  status,
  onStatusChange,
  date,
  onDateChange,
  courts,
  onClearFilters,
}: BookingsFiltersProps) {
  // Debounced search
  const [searchInput, setSearchInput] = useState(search);

  // Check if any filters are active
  const hasActiveFilters = Boolean(search) || Boolean(courtId) || Boolean(status) || Boolean(date);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const handleClearFilters = () => {
    setSearchInput("");
    onClearFilters();
  };

  const handleCourtSelect = (value: string) => {
    onCourtChange(value === "all" ? undefined : value);
  };

  const handleStatusSelect = (value: string) => {
    onStatusChange(value === "all" ? undefined : value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      onDateChange(undefined);
      return;
    }
    // Parse as local date using date-fns (YYYY-MM-DD format from input)
    const localDate = parse(value, "yyyy-MM-dd", new Date());
    onDateChange(localDate);
  };

  // Format date for input value
  const dateValue = date
    ? date.toISOString().split("T")[0]
    : "";

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="relative w-64">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar reservas..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Court filter */}
      <Select value={courtId ?? "all"} onValueChange={handleCourtSelect}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Todas las canchas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las canchas</SelectItem>
          {courts.map((court) => (
            <SelectItem key={court.id} value={court.id}>
              {court.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select value={status ?? "all"} onValueChange={handleStatusSelect}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date filter */}
      <Input
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        className="w-40"
        placeholder="dd/mm/yyyy"
      />

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <XIcon className="mr-1 h-4 w-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
