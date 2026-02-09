import { DISTRICT_SLUGS } from "~/lib/constants";

export interface District {
  name: string;
  courtCount: number;
  tagline: string;
  slug: string;
  /** Latitude (real coordinates for Lima districts) */
  lat: number;
  /** Longitude (real coordinates for Lima districts) */
  lng: number;
}

/**
 * Featured Lima districts with real geographic coordinates.
 * Coordinates are approximate center-points of each district.
 */
export const DISTRICTS: District[] = [
  {
    name: "San Isidro",
    courtCount: 3,
    tagline: "Zona financiera",
    lat: -12.0977,
    lng: -77.0365,
  },
  {
    name: "San Borja",
    courtCount: 2,
    tagline: "Bien conectado",
    lat: -12.1066,
    lng: -76.9986,
  },
  {
    name: "Miraflores",
    courtCount: 4,
    tagline: "Mas popular",
    lat: -12.1219,
    lng: -77.0299,
  },
  {
    name: "Barranco",
    courtCount: 2,
    tagline: "Vista al mar",
    lat: -12.1431,
    lng: -77.0195,
  },
  {
    name: "Surco",
    courtCount: 5,
    tagline: "Mayor variedad",
    lat: -12.1367,
    lng: -76.9780,
  },
  {
    name: "La Molina",
    courtCount: 2,
    tagline: "Canchas amplias",
    lat: -12.0868,
    lng: -76.9350,
  },
].map((d) => ({
  ...d,
  slug:
    DISTRICT_SLUGS[d.name] ?? d.name.toLowerCase().replace(/\s+/g, "-"),
}));
