"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface AddressMapPreviewProps {
  address: string;
  district: string;
  onGeocode: (lat: number, lng: number) => void;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const RATE_LIMIT_MS = 1000;
const DEBOUNCE_MS = 800;

export function AddressMapPreview({
  address,
  district,
  onGeocode,
}: AddressMapPreviewProps) {
  const [result, setResult] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const lastRequestTime = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const lastQuery = useRef("");

  const geocode = useCallback(
    async (addr: string, dist: string) => {
      const query = `${addr}, ${dist}, Lima, Peru`;

      // Skip if same query
      if (query === lastQuery.current) return;
      lastQuery.current = query;

      // Rate limit: wait if needed
      const now = Date.now();
      const elapsed = now - lastRequestTime.current;
      if (elapsed < RATE_LIMIT_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, RATE_LIMIT_MS - elapsed),
        );
      }

      setLoading(true);
      setError(false);

      try {
        lastRequestTime.current = Date.now();
        const params = new URLSearchParams({
          q: query,
          format: "json",
          limit: "1",
          countrycodes: "pe",
        });

        const response = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
          headers: {
            "User-Agent": "PadelHub/1.0",
          },
        });

        if (!response.ok) throw new Error("Geocoding failed");

        const data = (await response.json()) as {
          lat: string;
          lon: string;
          display_name: string;
        }[];

        if (data.length > 0 && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setResult({ lat, lng, displayName: data[0].display_name });
          onGeocode(lat, lng);
        } else {
          setResult(null);
          setError(true);
        }
      } catch {
        setResult(null);
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [onGeocode],
  );

  // Debounced trigger when address or district changes
  useEffect(() => {
    if (!address || address.length < 5 || !district || district.length < 2) {
      setResult(null);
      setError(false);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      void geocode(address, district);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [address, district, geocode]);

  if (!address || address.length < 5 || !district || district.length < 2) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Buscando ubicación...
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (!result) {
    return null;
  }

  const tileUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${result.lng - 0.005},${result.lat - 0.003},${result.lng + 0.005},${result.lat + 0.003}&layer=mapnik&marker=${result.lat},${result.lng}`;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border">
        <iframe
          title="Ubicación del local"
          src={tileUrl}
          width="100%"
          height="200"
          className="border-0"
          loading="lazy"
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>
          {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
        </span>
      </div>
    </div>
  );
}
