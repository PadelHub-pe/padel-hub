import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Format price from cents to PEN display format
 * e.g., 8000 → "S/ 80"
 * e.g., 8050 → "S/ 80.50"
 */
export function formatPricePEN(priceInCents: number): string {
  const soles = priceInCents / 100;
  if (soles % 1 === 0) {
    return `S/ ${soles.toFixed(0)}`;
  }
  return `S/ ${soles.toFixed(2)}`;
}

/**
 * Get the minimum price from an array of courts
 */
export function getMinPrice(
  courts: { priceInCents: number | null }[],
): number | null {
  const prices = courts
    .map((c) => c.priceInCents)
    .filter((p): p is number => p !== null);
  return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * Format a date in Spanish (Peru) format
 * e.g., "Lunes 15 de enero"
 */
export function formatDateES(date: Date): string {
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

/**
 * Format a short date
 * e.g., "15/01/2026"
 */
export function formatDateShort(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Format district name for display (capitalize properly)
 */
export function formatDistrictName(slug: string): string {
  const map: Record<string, string> = {
    miraflores: "Miraflores",
    "san-isidro": "San Isidro",
    surco: "Surco",
    "la-molina": "La Molina",
    barranco: "Barranco",
    "san-borja": "San Borja",
    surquillo: "Surquillo",
    "san-miguel": "San Miguel",
    "pueblo-libre": "Pueblo Libre",
    "jesus-maria": "Jesús María",
    magdalena: "Magdalena",
    chorrillos: "Chorrillos",
  };
  return (
    map[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

/**
 * Count courts by type
 */
export function countCourtsByType(
  courts: { type: string }[],
): { indoor: number; outdoor: number } {
  return {
    indoor: courts.filter((c) => c.type === "indoor").length,
    outdoor: courts.filter((c) => c.type === "outdoor").length,
  };
}
