"use client";

import dynamic from "next/dynamic";

const FacilityMap = dynamic(
  () => import("~/components/facility/facility-map"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted/30 flex h-[500px] w-full items-center justify-center rounded-lg border sm:h-[600px]">
        <div className="text-center">
          <div className="border-primary mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground text-sm">Cargando mapa...</p>
        </div>
      </div>
    ),
  },
);

interface FacilityForMap {
  name: string;
  slug: string;
  district: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  imageUrl?: string | null;
  courts: {
    id: string;
    name: string;
    type: string;
    priceInCents: number | null;
  }[];
}

export function FacilityMapWrapper({
  facilities,
}: {
  facilities: FacilityForMap[];
}) {
  return <FacilityMap facilities={facilities} />;
}
