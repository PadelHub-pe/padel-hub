"use client";

import { useEffect, useState } from "react";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@wifo/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "open_match";

interface Court {
  id: string;
  name: string;
}

interface BookingsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  courtId: string | undefined;
  onCourtChange: (value: string | undefined) => void;
  statuses: BookingStatus[];
  onStatusChange: (values: BookingStatus[]) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
  courts: Court[];
  onClearFilters: () => void;
}

const statusChips: { value: BookingStatus; label: string }[] = [
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
  statuses,
  onStatusChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
  courts,
  onClearFilters,
}: BookingsFiltersProps) {
  // Debounced search
  const [searchInput, setSearchInput] = useState(search);

  // Sync search input with external value (e.g., URL param change)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(courtId) ||
    statuses.length > 0 ||
    Boolean(dateFrom);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        onSearchChange(searchInput);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange, search]);

  // Defer Radix component mount to prevent hydration ID mismatches (BUG-005).
  // Same pattern as responsive-sidebar.tsx (BUG-002).
  const [radixMounted, setRadixMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setRadixMounted(true));
  }, []);

  const handleClearFilters = () => {
    setSearchInput("");
    onClearFilters();
  };

  const handleCourtSelect = (value: string) => {
    onCourtChange(value === "all" ? undefined : value);
  };

  const handleStatusToggle = (status: BookingStatus) => {
    if (statuses.includes(status)) {
      onStatusChange(statuses.filter((s) => s !== status));
    } else {
      onStatusChange([...statuses, status]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top row: search + court + date range */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative w-64">
          <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar reservas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Court filter — deferred mount to prevent hydration ID mismatch (BUG-005) */}
        {radixMounted ? (
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
        ) : (
          <div className="border-input h-9 w-40 rounded-md border" />
        )}

        {/* Date range */}
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateRangeChange={onDateRangeChange}
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

      {/* Status chips row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Estado:</span>
        {statusChips.map((chip) => {
          const isActive = statuses.includes(chip.value);
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleStatusToggle(chip.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date Range Picker
// ---------------------------------------------------------------------------

interface DateRangePickerProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
}

function DateRangePicker({
  dateFrom,
  dateTo,
  onDateRangeChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  // Defer Radix Popover mount to prevent hydration ID mismatches (BUG-005)
  const [radixMounted, setRadixMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setRadixMounted(true));
  }, []);

  const hasRange = Boolean(dateFrom) && Boolean(dateTo);

  const displayLabel =
    hasRange && dateFrom && dateTo
      ? `${formatShortDate(dateFrom)} - ${formatShortDate(dateTo)}`
      : "Rango de fechas";

  const handlePreset = (from: Date, to: Date) => {
    onDateRangeChange(from, to);
    setOpen(false);
  };

  const handleClear = () => {
    onDateRangeChange(undefined, undefined);
    setOpen(false);
  };

  const today = new Date();
  const presets = [
    {
      label: "Hoy",
      apply: () => handlePreset(today, today),
    },
    {
      label: "Esta semana",
      apply: () =>
        handlePreset(
          startOfWeek(today, { weekStartsOn: 1 }),
          endOfWeek(today, { weekStartsOn: 1 }),
        ),
    },
    {
      label: "Este mes",
      apply: () => handlePreset(startOfMonth(today), endOfMonth(today)),
    },
  ];

  // Format date for input value
  const fromValue = dateFrom ? dateFrom.toISOString().split("T")[0] : "";
  const toValue = dateTo ? dateTo.toISOString().split("T")[0] : "";

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onDateRangeChange(undefined, undefined);
      return;
    }
    const d = new Date(val + "T00:00:00");
    onDateRangeChange(d, dateTo ?? d);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onDateRangeChange(dateFrom, undefined);
      return;
    }
    const d = new Date(val + "T00:00:00");
    onDateRangeChange(dateFrom ?? d, d);
  };

  if (!radixMounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="min-w-[180px] justify-start font-normal text-gray-500"
        disabled
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        Rango de fechas
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "min-w-[180px] justify-start font-normal",
            !hasRange && "text-gray-500",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-3">
          {/* Presets */}
          <div className="flex gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={preset.apply}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom range */}
          <div className="flex items-center gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Desde</label>
              <Input
                type="date"
                value={fromValue}
                onChange={handleFromChange}
                className="h-8 w-36 text-sm"
              />
            </div>
            <span className="mt-4 text-gray-400">-</span>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Hasta</label>
              <Input
                type="date"
                value={toValue}
                onChange={handleToChange}
                className="h-8 w-36 text-sm"
              />
            </div>
          </div>

          {/* Clear */}
          {hasRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full text-xs text-gray-500"
            >
              Limpiar rango
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatShortDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

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

function CalendarIcon({ className }: { className?: string }) {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}
