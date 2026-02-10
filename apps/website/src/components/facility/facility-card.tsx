import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@wifo/ui/card";

import {
  countCourtsByType,
  formatDistrictName,
  formatPricePEN,
  getMinPrice,
} from "~/lib/format";
import { CourtTypeBadge } from "./court-type-badge";

interface FacilityCardProps {
  facility: {
    name: string;
    slug: string;
    description: string | null;
    address: string;
    district: string;
    photos: string[] | null;
    amenities: string[] | null;
    coreOfferings: string[] | null;
    latitude: string | null;
    longitude: string | null;
    courts: {
      id: string;
      name: string;
      type: string;
      priceInCents: number | null;
    }[];
  };
  isNew?: boolean;
}

export function FacilityCard({ facility, isNew }: FacilityCardProps) {
  const href = `/canchas/${facility.district}/${facility.slug}`;
  const minPrice = getMinPrice(facility.courts);
  const { indoor, outdoor } = countCourtsByType(facility.courts);

  return (
    <Link href={href} className="group block">
      <Card className="group-hover:border-primary/20 flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200 group-hover:shadow-lg">
        {/* Photo placeholder */}
        <div className="bg-muted relative aspect-[16/10] overflow-hidden">
          {facility.photos && facility.photos.length > 0 ? (
            <div className="bg-muted flex h-full items-center justify-center">
              <Image
                key={facility.photos[0]}
                src={facility.photos[0] || ""}
                alt={`${facility.name} - Cancha de padel en ${formatDistrictName(facility.district)}, Lima`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition-opacity duration-700 ease-in-out`}
                quality={85}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="text-muted-foreground/50 h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex gap-1">
            {isNew && (
              <span className="bg-secondary rounded-md px-2 py-0.5 text-xs font-semibold text-white">
                Nuevo
              </span>
            )}
            {indoor > 0 && <CourtTypeBadge type="indoor" />}
            {outdoor > 0 && <CourtTypeBadge type="outdoor" />}
          </div>

          {/* Price badge on image */}
          {minPrice !== null && (
            <div className="bg-background/90 text-secondary absolute right-2 bottom-2 rounded-md px-2 py-1 text-sm font-bold backdrop-blur-sm">
              {formatPricePEN(minPrice)}
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col p-4">
          <h3 className="group-hover:text-primary mb-1 line-clamp-1 font-semibold transition-colors">
            {facility.name}
          </h3>

          <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <span>
              {formatDistrictName(facility.district)} &middot;{" "}
              {facility.courts.length}{" "}
              {facility.courts.length === 1 ? "cancha" : "canchas"}
            </span>
          </div>

          <p className="text-muted-foreground hidden h-8 overflow-hidden text-xs leading-4 sm:block [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {facility.description ?? "\u00A0"}
          </p>

          {/* Amenities preview */}
          <div className="text-muted-foreground mt-auto hidden flex-wrap gap-1.5 pt-2 text-xs sm:flex">
            {facility.amenities && facility.amenities.length > 0 ? (
              <>
                {facility.amenities.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity}
                    className="bg-muted rounded-md px-1.5 py-0.5 capitalize"
                  >
                    {amenity.replace(/_/g, " ")}
                  </span>
                ))}
                {facility.amenities.length > 3 && (
                  <span className="text-muted-foreground/70">
                    +{facility.amenities.length - 3} mas
                  </span>
                )}
              </>
            ) : (
              <span className="invisible rounded-md px-1.5 py-0.5">&nbsp;</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
