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
import { CourtSelector } from "./court-selector";
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
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Filter slots by selected duration
  const filteredSlots = useMemo(
    () => slotsData.slots.filter((s) => s.durationMinutes === selectedDuration),
    [slotsData.slots, selectedDuration],
  );

  // Filter to selected court for step 2
  const courtSlots = useMemo(
    () =>
      selectedCourtId
        ? filteredSlots.filter((s) => s.courtId === selectedCourtId)
        : [],
    [filteredSlots, selectedCourtId],
  );

  const selectedCourtName = selectedCourtId
    ? (filteredSlots.find((s) => s.courtId === selectedCourtId)?.courtName ??
      null)
    : null;

  const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });

  function handleSelectCourt(courtId: string) {
    setSelectedCourtId(courtId);
    setSelectedSlot(null);
  }

  function handleBackToCourts() {
    setSelectedCourtId(null);
    setSelectedSlot(null);
  }

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
    <main className="container pt-4 pb-24">
      {/* Back link */}
      {selectedCourtId ? (
        <button
          type="button"
          onClick={handleBackToCourts}
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
          Cambiar cancha
        </button>
      ) : (
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
      )}

      {/* Header */}
      <h1 className="font-display mt-4 text-xl font-bold">
        {selectedCourtId ? selectedCourtName : facility.name}
      </h1>
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

      {/* Step 1: Court selection */}
      {!selectedCourtId && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-medium">Elige una cancha</p>
          <CourtSelector slots={filteredSlots} onSelect={handleSelectCourt} />
        </div>
      )}

      {/* Step 2: Slot selection for chosen court */}
      {selectedCourtId && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-medium">Elige un horario</p>
          <SlotGrid
            slots={courtSlots}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
          />
        </div>
      )}

      {/* Fixed bottom CTA */}
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
