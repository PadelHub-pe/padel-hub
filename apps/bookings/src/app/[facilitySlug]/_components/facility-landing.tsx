"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

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

  return (
    <main className="container pb-8">
      {/* Photo Carousel */}
      {photos.length > 0 && (
        <PhotoCarousel photos={photos} facilityName={facility.name} />
      )}

      {/* Facility Info */}
      <FacilityHeader
        name={facility.name}
        address={facility.address}
        district={facility.district}
        description={facility.description}
        courtCount={facility.courts.length}
      />

      {/* Amenities */}
      {amenities.length > 0 && <AmenityList amenities={amenities} />}

      {/* Date Selector + CTA */}
      <DateSelector facilitySlug={facilitySlug} />
    </main>
  );
}
