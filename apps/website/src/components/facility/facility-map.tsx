"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

import { formatDistrictName, formatPricePEN, getMinPrice } from "~/lib/format";

/** Fix Leaflet default icon path issue in bundlers */
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FacilityForMap {
  name: string;
  slug: string;
  district: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  imageUrl?: string | null;
  courts: { id: string; name: string; type: string; priceInCents: number | null }[];
}

interface FacilityMapProps {
  facilities: FacilityForMap[];
}

// ---------------------------------------------------------------------------
// Marker icon
// ---------------------------------------------------------------------------

/** Blue circle badge showing the number of courts available. */
function createFacilityIcon(courtCount: number) {
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
    html: `
      <div style="
        background: #3B82F6;
        border: 2px solid white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">${courtCount}</div>
    `,
  });
}

// ---------------------------------------------------------------------------
// FitBounds helper
// ---------------------------------------------------------------------------

function FitBoundsOnLoad({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [40, 40], animate: false });
  }, [bounds, map]);
  return null;
}

// ---------------------------------------------------------------------------
// Default center (Lima)
// ---------------------------------------------------------------------------
const DEFAULT_CENTER: [number, number] = [-12.115, -76.985];
const DEFAULT_ZOOM = 13;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FacilityMap({ facilities }: FacilityMapProps) {
  // Only show facilities that have coordinates
  const mappable = facilities.filter(
    (f) => f.latitude !== null && f.longitude !== null,
  );

  // Compute bounds
  let bounds: L.LatLngBounds | undefined;
  if (mappable.length > 0) {
    const lats = mappable.map((f) => parseFloat(f.latitude!));
    const lngs = mappable.map((f) => parseFloat(f.longitude!));
    bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    );
  }

  if (mappable.length === 0) {
    return (
      <div className="bg-muted/30 z-0 flex h-[500px] w-full items-center justify-center rounded-lg border sm:h-[600px]">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            No hay canchas con ubicación disponible para mostrar en el mapa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="z-0 h-[500px] w-full rounded-lg sm:h-[600px]"
      zoomControl={true}
      style={{ background: "#f8fafc" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      {bounds && <FitBoundsOnLoad bounds={bounds} />}

      {mappable.map((facility) => {
        const minPrice = getMinPrice(facility.courts);
        const priceLabel = minPrice ? formatPricePEN(minPrice) : null;

        return (
          <Marker
            key={facility.slug}
            position={[
              parseFloat(facility.latitude!),
              parseFloat(facility.longitude!),
            ]}
            icon={createFacilityIcon(facility.courts.length)}
          >
            <Popup>
              <Link
                href={`/canchas/${facility.district}/${facility.slug}`}
                className="flex gap-2.5 no-underline"
                style={{ minWidth: 220 }}
              >
                {facility.imageUrl ? (
                  <img
                    src={facility.imageUrl}
                    alt={facility.name}
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md"
                    style={{ background: "#f1f5f9" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
                <div className="flex min-w-0 flex-col justify-center">
                  <span className="truncate text-sm font-semibold leading-tight text-gray-900">
                    {facility.name}
                  </span>
                  <span className="mt-0.5 text-xs leading-tight text-gray-500">
                    {formatDistrictName(facility.district)} · {facility.courts.length}{" "}
                    {facility.courts.length === 1 ? "cancha" : "canchas"}
                  </span>
                  {priceLabel && (
                    <span className="mt-0.5 text-xs font-semibold leading-tight text-emerald-600">
                      Desde {priceLabel}
                    </span>
                  )}
                </div>
              </Link>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
