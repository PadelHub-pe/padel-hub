"use client";

import { useState } from "react";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@wifo/ui/button";

import { useTRPC } from "~/trpc/react";
import { AmenityList } from "./amenity-list";
import { DateSelector } from "./date-selector";
import { FacilityHeader } from "./facility-header";
import { PhotoCarousel } from "./photo-carousel";

interface FacilityLandingProps {
  facilitySlug: string;
}

export function FacilityLanding({ facilitySlug }: FacilityLandingProps) {
  const trpc = useTRPC();
  const { data: facility } = useSuspenseQuery(
    trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }),
  );

  const photos = facility.photos ?? [];
  const amenities = facility.amenities ?? [];

  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const bookingHref = `/${facilitySlug}/book?date=${selectedDate.toISOString().split("T")[0]}`;

  return (
    <main className="pb-20">
      {/* Brand Header */}
      <header className="container flex items-center justify-between py-3">
        <span className="font-display text-primary text-sm font-bold tracking-tight">
          PadelHub
        </span>
        <Link
          href={`/${facilitySlug}/mis-reservas`}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Mis Reservas
        </Link>
      </header>

      {/* Photo Carousel */}
      {photos.length > 0 && (
        <PhotoCarousel photos={photos} facilityName={facility.name} />
      )}

      {/* Content Sections */}
      <div className="container mt-5 space-y-5">
        {/* Facility Info */}
        <FacilityHeader
          name={facility.name}
          address={facility.address}
          district={facility.district}
          description={facility.description}
          courtCount={facility.courts.length}
        />

        {/* Amenities */}
        {amenities.length > 0 && (
          <>
            <div className="border-border border-t" />
            <AmenityList amenities={amenities} />
          </>
        )}

        {/* Date Selection */}
        <div className="border-border border-t" />
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Sticky Bottom CTA */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-sm">
        <div className="mx-auto flex max-w-[480px] items-center gap-3 px-4 py-3">
          <div className="min-w-0 shrink-0">
            <p className="text-muted-foreground text-xs">Fecha</p>
            <p className="text-sm font-medium capitalize">
              {format(selectedDate, "EEE d MMM", { locale: es })}
            </p>
          </div>
          <Button asChild className="flex-1" size="lg">
            <Link href={bookingHref}>Ver disponibilidad</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
