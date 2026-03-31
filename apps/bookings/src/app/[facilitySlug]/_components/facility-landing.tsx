"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";

import { Button } from "@wifo/ui/button";

import { useTRPC } from "~/trpc/react";
import { AmenityList } from "./amenity-list";
import { DateSelector } from "./date-selector";
import { HeroSection } from "./hero-section";

interface SlotItem {
  courtId: string;
  courtName: string;
  courtType: "indoor" | "outdoor";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceInCents: number;
  isPeakRate: boolean;
  zone: "regular" | "peak";
}

interface FacilityLandingProps {
  facilitySlug: string;
  initialDate?: Date;
}

export function FacilityLanding({
  facilitySlug,
  initialDate,
}: FacilityLandingProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: facility } = useSuspenseQuery(
    trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }),
  );

  const photos = facility.photos ?? [];
  const amenities = facility.amenities ?? [];

  const [selectedDate, setSelectedDate] = useState<Date>(
    () => initialDate ?? startOfDay(new Date()),
  );
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  const durations = facility.allowedDurationMinutes ?? [60, 90];
  const [selectedDuration, setSelectedDuration] = useState(durations[0] ?? 60);

  function handleDateChange(date: Date) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function handleDurationChange(duration: number) {
    setSelectedDuration(duration);
    setSelectedSlot(null);
  }

  function handleContinue() {
    if (!selectedSlot) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const params = new URLSearchParams({
      courtId: selectedSlot.courtId,
      date: dateStr,
      start: selectedSlot.startTime,
      end: selectedSlot.endTime,
    });
    router.push(`/${facilitySlug}/confirm?${params.toString()}`);
  }

  return (
    <main className="overflow-x-hidden pb-24">
      {/* Brand Header */}
      <header className="container flex items-center justify-between py-3">
        <img src="/logo.svg" alt="PadelHub" className="h-5" />
        <Link
          href={`/${facilitySlug}/mis-reservas`}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Mis Reservas
        </Link>
      </header>

      {/* Compact Hero */}
      <HeroSection
        name={facility.name}
        district={facility.district}
        address={facility.address}
        courtCount={facility.courts.length}
        photos={photos}
      />

      {/* Booking Flow */}
      <div className="container mt-5 space-y-5">
        {/* Date Selection */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={handleDateChange}
        />

        {/* Duration Tabs */}
        {durations.length > 1 && (
          <DurationTabs
            durations={durations}
            selected={selectedDuration}
            onSelect={handleDurationChange}
          />
        )}

        {/* Slot Grid - All Courts (own Suspense boundary so date changes only blank this section) */}
        <Suspense fallback={<SlotsSkeleton />}>
          <SlotsSection
            facilitySlug={facilitySlug}
            date={selectedDate}
            duration={selectedDuration}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
          />
        </Suspense>

        {/* Secondary Info */}
        {(amenities.length > 0 || facility.description) && (
          <>
            <div className="border-border border-t" />
            {facility.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {facility.description}
              </p>
            )}
            {amenities.length > 0 && <AmenityList amenities={amenities} />}
          </>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      {selectedSlot && (
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-sm">
          <div className="mx-auto max-w-[480px] px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedSlot.courtName} · {selectedSlot.startTime} –{" "}
                {selectedSlot.endTime}
              </span>
              <span className="font-semibold">
                S/ {(selectedSlot.priceInCents / 100).toFixed(0)}
              </span>
            </div>
            <Button className="w-full" size="lg" onClick={handleContinue}>
              Continuar
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- Inline sub-components ---------- */

/** Duration filter tabs */
function DurationTabs({
  durations,
  selected,
  onSelect,
}: {
  durations: number[];
  selected: number;
  onSelect: (d: number) => void;
}) {
  function formatDuration(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  return (
    <section>
      <p className="mb-2 text-sm font-medium">Duración</p>
      <div className="flex gap-2">
        {durations.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              d === selected
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            {formatDuration(d)}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Slots loading skeleton */
function SlotsSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Horarios disponibles</p>
      </div>
      {/* Filter chips skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted h-8 w-20 animate-pulse rounded-full"
          />
        ))}
      </div>
      {/* Time block skeleton */}
      <div className="space-y-4">
        <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, j) => (
            <div
              key={j}
              className="bg-muted h-[72px] animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Time-block helpers ---------- */

type TimeBlock = "mañana" | "tarde" | "noche";

function getTimeBlock(startTime: string): TimeBlock {
  const hour = Number(startTime.split(":")[0]);
  if (hour < 12) return "mañana";
  if (hour < 18) return "tarde";
  return "noche";
}

const TIME_BLOCK_LABELS: Record<TimeBlock, string> = {
  mañana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
};

interface TimeGroup {
  startTime: string;
  endTime: string;
  block: TimeBlock;
  slots: SlotItem[];
}

function groupSlotsByTime(slots: SlotItem[]): TimeGroup[] {
  const map = new Map<string, TimeGroup>();

  for (const slot of slots) {
    const key = `${slot.startTime}-${slot.endTime}`;
    let group = map.get(key);
    if (!group) {
      group = {
        startTime: slot.startTime,
        endTime: slot.endTime,
        block: getTimeBlock(slot.startTime),
        slots: [],
      };
      map.set(key, group);
    }
    group.slots.push(slot);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
}

/** Court filter chips */
function CourtFilterChips({
  courts,
  selected,
  onSelect,
}: {
  courts: { courtId: string; courtName: string; courtType: string }[];
  selected: string | null;
  onSelect: (courtId: string | null) => void;
}) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
          selected === null
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
        }`}
      >
        Todas
      </button>
      {courts.map((court) => (
        <button
          key={court.courtId}
          type="button"
          onClick={() => onSelect(court.courtId)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            selected === court.courtId
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
          }`}
        >
          {court.courtName}
        </button>
      ))}
    </div>
  );
}

/** Inner component that fetches slots with useSuspenseQuery — suspended by parent Suspense boundary */
function SlotsSection({
  facilitySlug,
  date,
  duration,
  selectedSlot,
  onSelect,
}: {
  facilitySlug: string;
  date: Date;
  duration: number;
  selectedSlot: SlotItem | null;
  onSelect: (slot: SlotItem) => void;
}) {
  const trpc = useTRPC();
  const { data: slotsData } = useSuspenseQuery(
    trpc.publicBooking.getAvailableSlots.queryOptions({
      slug: facilitySlug,
      date,
    }),
  );

  const [courtFilter, setCourtFilter] = useState<string | null>(null);

  // Unique courts for filter chips (derived from ALL slots for this duration)
  const courts = useMemo(() => {
    const seen = new Map<
      string,
      { courtId: string; courtName: string; courtType: string }
    >();
    for (const s of slotsData.slots) {
      if (s.durationMinutes === duration && !seen.has(s.courtId)) {
        seen.set(s.courtId, {
          courtId: s.courtId,
          courtName: s.courtName,
          courtType: s.courtType,
        });
      }
    }
    return Array.from(seen.values());
  }, [slotsData.slots, duration]);

  // Reset court filter if the selected court has no slots for this duration
  const validFilter =
    courtFilter !== null && courts.some((c) => c.courtId === courtFilter)
      ? courtFilter
      : null;
  if (validFilter !== courtFilter) {
    setCourtFilter(null);
  }

  const filteredSlots = useMemo(
    () =>
      slotsData.slots.filter(
        (s) =>
          s.durationMinutes === duration &&
          (validFilter === null || s.courtId === validFilter),
      ),
    [slotsData.slots, duration, validFilter],
  );

  const timeGroups = useMemo(
    () => groupSlotsByTime(filteredSlots),
    [filteredSlots],
  );

  // Pre-compute which time groups start a new block (avoids mutable variable in render)
  const blockStarts = useMemo(() => {
    const set = new Set<number>();
    let prev: TimeBlock | null = null;
    for (let i = 0; i < timeGroups.length; i++) {
      const group = timeGroups[i];
      if (group && group.block !== prev) {
        set.add(i);
        prev = group.block;
      }
    }
    return set;
  }, [timeGroups]);

  const hasSlotsForDuration = slotsData.slots.some(
    (s) => s.durationMinutes === duration,
  );

  if (!hasSlotsForDuration) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground text-sm">
          No hay horarios disponibles para esta fecha y duración.
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Prueba con otra fecha o duración.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <p className="text-sm font-medium">Horarios disponibles</p>

      {/* Court filter chips — only show when there are 2+ courts */}
      {courts.length > 1 && (
        <CourtFilterChips
          courts={courts}
          selected={validFilter}
          onSelect={setCourtFilter}
        />
      )}

      {filteredSlots.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-muted-foreground text-sm">
            No hay horarios para esta cancha.
          </p>
          <button
            type="button"
            onClick={() => setCourtFilter(null)}
            className="text-primary mt-1 text-xs font-medium"
          >
            Ver todas las canchas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {timeGroups.map((group, idx) => (
            <div key={`${group.startTime}-${group.endTime}`}>
              {blockStarts.has(idx) && (
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                  {TIME_BLOCK_LABELS[group.block]}
                </p>
              )}
              <p className="text-muted-foreground mb-2 text-xs">
                {group.startTime} – {group.endTime}
              </p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {group.slots.map((slot) => {
                  const isSelected =
                    selectedSlot != null &&
                    selectedSlot.courtId === slot.courtId &&
                    selectedSlot.startTime === slot.startTime &&
                    selectedSlot.endTime === slot.endTime;

                  return (
                    <button
                      key={`${slot.courtId}-${slot.startTime}-${slot.endTime}`}
                      type="button"
                      onClick={() => onSelect(slot)}
                      aria-label={`${slot.courtName}, ${slot.startTime} a ${slot.endTime}, S/ ${(slot.priceInCents / 100).toFixed(0)}${slot.isPeakRate ? " (hora punta)" : ""}`}
                      className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {slot.courtName}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${
                            slot.isPeakRate
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          S/ {(slot.priceInCents / 100).toFixed(0)}
                        </span>
                        {slot.isPeakRate && (
                          <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">
                            Punta
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
