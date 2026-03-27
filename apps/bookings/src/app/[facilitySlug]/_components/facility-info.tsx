import { Badge } from "@wifo/ui/badge";

interface FacilityInfoProps {
  name: string;
  address: string | null;
  district: string;
  city: string;
  phone: string | null;
  courts: { id: string; name: string; type: string }[];
  amenities: string[] | null;
  description: string | null;
}

export function FacilityInfo({
  name,
  address,
  district,
  city,
  phone,
  courts,
  amenities,
  description,
}: FacilityInfoProps) {
  return (
    <section className="mt-4 space-y-3">
      {/* Name & Location */}
      <div>
        <h1 className="font-display text-2xl font-bold">{name}</h1>
        <p className="text-muted-foreground text-sm">
          <MapPinIcon className="mr-1 inline-block h-4 w-4 align-text-bottom" />
          {address ? `${address}, ` : ""}
          {district}, {city}
        </p>
      </div>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      {/* Courts summary */}
      <div className="flex flex-wrap gap-2">
        {courts.map((court) => (
          <Badge key={court.id} variant="secondary">
            {court.name}
            <span className="text-muted-foreground ml-1 text-xs">
              ({court.type === "indoor" ? "Techada" : "Aire libre"})
            </span>
          </Badge>
        ))}
      </div>

      {/* Amenities */}
      {amenities && amenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {amenities.map((amenity) => (
            <Badge key={amenity} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
        </div>
      )}

      {/* Phone */}
      {phone && (
        <p className="text-muted-foreground text-sm">
          <PhoneIcon className="mr-1 inline-block h-4 w-4 align-text-bottom" />
          {phone}
        </p>
      )}
    </section>
  );
}

// =============================================================================
// Inline SVG Icons
// =============================================================================

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
