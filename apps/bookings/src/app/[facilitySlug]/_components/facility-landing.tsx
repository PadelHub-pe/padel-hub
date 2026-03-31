"use client";

import { Suspense, useState } from "react";
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
    <section className="space-y-5">
      <p className="text-sm font-medium">Horarios disponibles</p>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-5 w-14 animate-pulse rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="bg-muted h-16 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </section>
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

  const filteredSlots = slotsData.slots.filter(
    (s) => s.durationMinutes === duration,
  );

  if (filteredSlots.length === 0) {
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

  // Group slots by court
  const groups = new Map<
    string,
    {
      courtId: string;
      courtName: string;
      courtType: string;
      slots: SlotItem[];
    }
  >();

  for (const slot of filteredSlots) {
    let group = groups.get(slot.courtId);
    if (!group) {
      group = {
        courtId: slot.courtId,
        courtName: slot.courtName,
        courtType: slot.courtType,
        slots: [],
      };
      groups.set(slot.courtId, group);
    }
    group.slots.push(slot);
  }

  const courtGroups = Array.from(groups.values());

  return (
    <section className="space-y-5">
      <p className="text-sm font-medium">Horarios disponibles</p>
      {courtGroups.map((group) => (
        <div key={group.courtId}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold">{group.courtName}</h3>
            <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize">
              {group.courtType}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
                    {slot.startTime} – {slot.endTime}
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
    </section>
  );
}
