import { FacilityCard } from "./facility-card";

interface Facility {
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
}

/**
 * @param mobileLimit - When set, only this many cards are shown on mobile
 *   (the rest get `hidden sm:block`). All cards always render on sm+.
 */
export function FacilityGrid({
  facilities,
  mobileLimit,
}: {
  facilities: Facility[];
  mobileLimit?: number;
}) {
  if (facilities.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg
          className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <h3 className="text-muted-foreground text-lg font-medium">
          No se encontraron canchas
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Intenta cambiar los filtros de busqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {facilities.map((facility, i) => (
        <div
          key={facility.slug}
          className={
            mobileLimit != null && i >= mobileLimit
              ? "hidden sm:block"
              : undefined
          }
        >
          <FacilityCard facility={facility} />
        </div>
      ))}
    </div>
  );
}
