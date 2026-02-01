"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { AmenitiesSection } from "./amenities-section";
import { BasicInfoSection } from "./basic-info-section";
import { FacilityHeader } from "./facility-header";
import { LocationSection } from "./location-section";
import { PhotosSection } from "./photos-section";

export function FacilityView() {
  const trpc = useTRPC();

  const { data: profile } = useSuspenseQuery(
    trpc.facility.getProfile.queryOptions(),
  );

  return (
    <div className="p-8">
      <FacilityHeader />

      <div className="mt-8 space-y-6">
        <BasicInfoSection
          name={profile.name}
          phone={profile.phone}
          email={profile.email}
          website={profile.website}
          description={profile.description}
        />

        <LocationSection address={profile.address} />

        <PhotosSection />

        <AmenitiesSection selectedAmenities={profile.amenities} />
      </div>
    </div>
  );
}
