"use client";

import { useEffect, useState } from "react";
import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";

interface FacilitiesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: "all" | "active" | "inactive";
  onStatusChange: (value: "all" | "active" | "inactive") => void;
  district: string | undefined;
  onDistrictChange: (value: string | undefined) => void;
  sortBy: "name" | "bookings" | "revenue" | "utilization";
  onSortByChange: (
    value: "name" | "bookings" | "revenue" | "utilization",
  ) => void;
  districts: string[];
  onClearFilters: () => void;
}

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

const sortOptions = [
  { value: "name", label: "Nombre" },
  { value: "bookings", label: "Reservas de hoy" },
  { value: "revenue", label: "Ingresos del mes" },
  { value: "utilization", label: "Utilización" },
];

export function FacilitiesFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  district,
  onDistrictChange,
  sortBy,
  onSortByChange,
  districts,
  onClearFilters,
}: FacilitiesFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);

  const hasActiveFilters =
    Boolean(search) || status !== "all" || Boolean(district) || sortBy !== "name";

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const handleStatusSelect = (value: string) => {
    onStatusChange(value as "all" | "active" | "inactive");
  };

  const handleDistrictSelect = (value: string) => {
    onDistrictChange(value === "all" ? undefined : value);
  };

  const handleSortSelect = (value: string) => {
    onSortByChange(value as "name" | "bookings" | "revenue" | "utilization");
  };

  const handleClearFilters = () => {
    setSearchInput("");
    onClearFilters();
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="relative w-64">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar locales..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select value={status} onValueChange={handleStatusSelect}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* District filter */}
      <Select value={district ?? "all"} onValueChange={handleDistrictSelect}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Todos los distritos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los distritos</SelectItem>
          {districts.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort by */}
      <Select value={sortBy} onValueChange={handleSortSelect}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
