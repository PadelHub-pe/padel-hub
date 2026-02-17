"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { District } from "./district-data";

/** Fix Leaflet default icon path issue in bundlers */
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

/**
 * Create a custom circular marker icon with a court count number.
 * Uses divIcon (pure HTML/CSS) so no image assets needed.
 */
function createDistrictIcon(courtCount: number, isActive: boolean) {
  const size = isActive ? 44 : 36;
  const bg = isActive ? "#3B82F6" : "white";
  const color = isActive ? "white" : "#3B82F6";
  const border = isActive ? "#3B82F6" : "rgba(59,130,246,0.4)";
  const shadow = isActive
    ? "0 4px 12px rgba(59,130,246,0.4)"
    : "0 2px 6px rgba(0,0,0,0.15)";

  return L.divIcon({
    className: "", // no default leaflet styles
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bg};
        border: 2.5px solid ${border};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: ${isActive ? 14 : 12}px;
        color: ${color};
        box-shadow: ${shadow};
        transition: all 0.2s ease;
        cursor: pointer;
      ">${courtCount}</div>
    `,
  });
}

/** Default overview: all districts visible */
const DEFAULT_CENTER: [number, number] = [-12.115, -76.985];
const DEFAULT_ZOOM = 13;

/**
 * Compute a LatLngBounds that contains all district markers with padding.
 */
function getAllBounds(districts: District[]) {
  const lats = districts.map((d) => d.lat);
  const lngs = districts.map((d) => d.lng);
  return L.latLngBounds(
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  );
}

/**
 * On mount, fits the map to show all districts.
 * On hover, flies to the hovered district.
 * On unhover, flies back to show all districts.
 */
function FlyToDistrict({
  districts,
  activeDistrict,
}: {
  districts: District[];
  activeDistrict: string | null;
}) {
  const map = useMap();
  const boundsRef = useRef<L.LatLngBounds | null>(null);

  // Fit all markers on first render
  useEffect(() => {
    const bounds = getAllBounds(districts);
    boundsRef.current = bounds;
    map.fitBounds(bounds, { padding: [30, 30], animate: false });
  }, [districts, map]);

  // Fly to district on hover, or back to full view
  useEffect(() => {
    if (!activeDistrict) {
      const bounds = boundsRef.current ?? getAllBounds(districts);
      map.flyToBounds(bounds, { padding: [30, 30], duration: 0.6 });
      return;
    }
    const district = districts.find((d) => d.name === activeDistrict);
    if (district) {
      map.flyTo([district.lat, district.lng], 14, { duration: 0.8 });
    }
  }, [activeDistrict, districts, map]);

  return null;
}

interface DistrictMapProps {
  districts: District[];
  activeDistrict: string | null;
  onDistrictClick: (slug: string) => void;
}

export default function DistrictMap({
  districts,
  activeDistrict,
  onDistrictClick,
}: DistrictMapProps) {
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Update marker icons when activeDistrict changes
  useEffect(() => {
    for (const district of districts) {
      const marker = markersRef.current.get(district.name);
      if (marker) {
        marker.setIcon(
          createDistrictIcon(
            district.courtCount,
            district.name === activeDistrict,
          ),
        );
      }
    }
  }, [activeDistrict, districts]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      className="h-full w-full rounded-2xl"
      zoomControl={false}
      attributionControl={false}
      style={{ background: "#f8fafc" }}
    >
      {/* Light, clean map tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      <FlyToDistrict
        districts={districts}
        activeDistrict={activeDistrict}
      />

      {districts.map((district) => (
        <Marker
          key={district.name}
          position={[district.lat, district.lng]}
          icon={createDistrictIcon(
            district.courtCount,
            district.name === activeDistrict,
          )}
          ref={(ref) => {
            if (ref) {
              markersRef.current.set(district.name, ref);
            }
          }}
          eventHandlers={{
            click: () => onDistrictClick(district.slug),
          }}
        >
          <Popup>
            <div className="text-center">
              <p className="text-sm font-semibold">{district.name}</p>
              <p className="text-xs text-muted-foreground">
                {district.courtCount} canchas &middot; {district.tagline}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
