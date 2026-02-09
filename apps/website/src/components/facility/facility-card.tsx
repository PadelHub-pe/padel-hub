import Link from "next/link";
import { Card, CardContent } from "@wifo/ui/card";

import { DISTRICT_SLUGS } from "~/lib/constants";
import { formatPricePEN, getMinPrice, countCourtsByType } from "~/lib/format";
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
  const districtSlug =
    DISTRICT_SLUGS[facility.district] ??
    facility.district.toLowerCase().replace(/\s+/g, "-");
  const href = `/canchas/${districtSlug}/${facility.slug}`;
  const minPrice = getMinPrice(facility.courts);
  const { indoor, outdoor } = countCourtsByType(facility.courts);

  return (
    <Link href={href} className="group block">
      <Card className="h-full overflow-hidden rounded-xl border transition-all duration-200 group-hover:border-primary/20 group-hover:shadow-lg">
        {/* Photo placeholder */}
        <div className="bg-muted relative aspect-[16/10] overflow-hidden">
          {facility.photos && facility.photos.length > 0 ? (
            <div className="bg-muted flex h-full items-center justify-center">
              <span className="text-muted-foreground text-sm">
                {facility.photos[0]}
              </span>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="text-muted-foreground/50 h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="currentColor"
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
          <div className="absolute left-2 top-2 flex gap-1">
            {isNew && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-white">
                Nuevo
              </span>
            )}
            {indoor > 0 && <CourtTypeBadge type="indoor" />}
            {outdoor > 0 && <CourtTypeBadge type="outdoor" />}
          </div>

          {/* Price badge on image */}
          {minPrice !== null && (
            <div className="absolute bottom-2 right-2 rounded-md bg-background/90 px-2 py-1 text-sm font-bold text-secondary backdrop-blur-sm">
              {formatPricePEN(minPrice)}
            </div>
          )}
        </div>

        <CardContent className="p-4">
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
              {facility.district} &middot; {facility.courts.length}{" "}
              {facility.courts.length === 1 ? "cancha" : "canchas"}
            </span>
          </div>

          {facility.description && (
            <p className="text-muted-foreground hidden line-clamp-2 text-xs sm:block">
              {facility.description}
            </p>
          )}

          {/* Amenities preview */}
          {facility.amenities && facility.amenities.length > 0 && (
            <div className="text-muted-foreground mt-2 hidden flex-wrap gap-1.5 text-xs sm:mt-3 sm:flex">
              {facility.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-md bg-muted px-1.5 py-0.5 capitalize"
                >
                  {amenity.replace(/_/g, " ")}
                </span>
              ))}
              {facility.amenities.length > 3 && (
                <span className="text-muted-foreground/70">
                  +{facility.amenities.length - 3} mas
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
