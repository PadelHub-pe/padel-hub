"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@wifo/ui/button";

import type { SlotItem } from "./slot-grid";
import { useTRPC } from "~/trpc/react";
import { DurationTabs } from "./duration-tabs";
import { SlotGrid } from "./slot-grid";

interface BookingPageProps {
  facilitySlug: string;
}

export function BookingPage({ facilitySlug }: BookingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const trpc = useTRPC();

  // Parse date from URL
  const date = useMemo(() => {
    if (!dateParam) return new Date();
    try {
      return parseISO(dateParam);
    } catch {
      return new Date();
    }
  }, [dateParam]);

  const dateStr = dateParam ?? format(date, "yyyy-MM-dd");

  // Fetch facility info (for durations + name)
  const { data: facility } = useSuspenseQuery(
    trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }),
  );

  // Fetch available slots
  const { data: slotsData } = useSuspenseQuery(
    trpc.publicBooking.getAvailableSlots.queryOptions({
      slug: facilitySlug,
      date,
    }),
  );

  const durations = facility.allowedDurationMinutes ?? [60, 90];
  const [selectedDuration, setSelectedDuration] = useState(durations[0] ?? 60);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Filter slots by selected duration
  const filteredSlots = useMemo(
    () => slotsData.slots.filter((s) => s.durationMinutes === selectedDuration),
    [slotsData.slots, selectedDuration],
  );

  const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });

  function handleContinue() {
    if (!selectedSlot) return;
    const params = new URLSearchParams({
      courtId: selectedSlot.courtId,
      date: dateStr,
      start: selectedSlot.startTime,
      end: selectedSlot.endTime,
    });
    router.push(`/${facilitySlug}/confirm?${params.toString()}`);
  }

  return (
    <main className="container pb-24">
      {/* Back link */}
      <Link
        href={`/${facilitySlug}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver
      </Link>

      {/* Header */}
      <h1 className="font-display mt-4 text-xl font-bold">{facility.name}</h1>
      <p className="text-muted-foreground mt-1 text-sm capitalize">
        {formattedDate}
      </p>

      {/* Duration filter */}
      {durations.length > 1 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Duración</p>
          <DurationTabs
            durations={durations}
            selected={selectedDuration}
            onSelect={(d) => {
              setSelectedDuration(d);
              setSelectedSlot(null);
            }}
          />
        </div>
      )}

      {/* Slot grid */}
      <div className="mt-5">
        <SlotGrid
          slots={filteredSlots}
          selectedSlot={selectedSlot}
          onSelect={setSelectedSlot}
        />
      </div>

      {/* Fixed bottom CTA */}
      {selectedSlot && (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 border-t p-4 backdrop-blur-sm">
          <div className="container">
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
