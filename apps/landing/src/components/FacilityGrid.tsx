import { useState } from "react";

import type { DirectoryFacility } from "../data/facilities";

const COURT_TYPE_LABELS: Record<DirectoryFacility["courtType"], string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  mixto: "Mixto",
};

function getWhatsAppLink(facility: DirectoryFacility): string {
  const message = encodeURIComponent(
    `Hola, vengo de PadelHub. Quisiera reservar una cancha en ${facility.name}.`,
  );
  return `${facility.whatsappUrl}?text=${message}`;
}

function getCtaProps(facility: DirectoryFacility) {
  if (facility.bookingSlug) {
    return {
      href: `https://bookings.padelhub.pe/${facility.bookingSlug}`,
      label: "Reservar Online",
      icon: "booking" as const,
      className:
        "bg-secondary text-white hover:shadow-[0_4px_16px_rgba(16,185,129,0.3)]",
    };
  }
  if (facility.whatsappUrl) {
    return {
      href: getWhatsAppLink(facility),
      label: "Reservar por WhatsApp",
      icon: "whatsapp" as const,
      className:
        "bg-[#25D366] text-white hover:shadow-[0_4px_16px_rgba(37,211,102,0.3)]",
    };
  }
  if (facility.instagramUrl) {
    return {
      href: facility.instagramUrl,
      label: "Contactar por Instagram",
      icon: "instagram" as const,
      className:
        "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white",
    };
  }
  return {
    href: facility.googleMapsUrl,
    label: "Ver en Google Maps",
    icon: "maps" as const,
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function MapsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function FacilityCard({ facility }: { facility: DirectoryFacility }) {
  const [imgError, setImgError] = useState(false);

  const courtInfo = [
    facility.courtCount
      ? `${facility.courtCount} ${facility.courtCount === 1 ? "cancha" : "canchas"}`
      : null,
    COURT_TYPE_LABELS[facility.courtType],
  ]
    .filter(Boolean)
    .join(" · ");

  const displayAmenities = facility.amenities.slice(0, 4);
  const cta = getCtaProps(facility);

  return (
    <div className="group overflow-hidden rounded-[20px] border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg">
      {/* Image */}
      <div className="from-primary-100 to-secondary-100 relative h-48 overflow-hidden bg-gradient-to-br">
        {facility.imageUrl && !imgError ? (
          <img
            src={facility.imageUrl}
            alt={facility.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-60">
            🎾
          </div>
        )}
        {/* District badge */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
            {facility.district}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col p-5">
        <h3 className="font-display mb-1 text-lg leading-tight font-semibold text-gray-900">
          {facility.name}
        </h3>

        <p className="mb-3 text-sm text-gray-500">{courtInfo}</p>

        {/* Amenity chips */}
        {displayAmenities.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {displayAmenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
              >
                {amenity}
              </span>
            ))}
            {facility.amenities.length > 4 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                +{facility.amenities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <a
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${cta.className}`}
        >
          {cta.icon === "whatsapp" && <WhatsAppIcon />}
          {cta.icon === "instagram" && <InstagramIcon />}
          {cta.icon === "maps" && <MapsIcon />}
          {cta.label}
        </a>
      </div>
    </div>
  );
}

interface Props {
  facilities: DirectoryFacility[];
  districts: string[];
}

export default function FacilityGrid({ facilities, districts }: Props) {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const filtered = selectedDistrict
    ? facilities.filter((f) => f.district === selectedDistrict)
    : facilities;

  return (
    <div>
      {/* District filter pills */}
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedDistrict(null)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            selectedDistrict === null
              ? "bg-secondary text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos
        </button>
        {districts.map((district) => (
          <button
            key={district}
            type="button"
            onClick={() =>
              setSelectedDistrict(
                selectedDistrict === district ? null : district,
              )
            }
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              selectedDistrict === district
                ? "bg-secondary text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {district}
          </button>
        ))}
      </div>

      {/* Facility cards grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>
    </div>
  );
}
