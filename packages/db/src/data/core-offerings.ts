/**
 * Core offerings mapping
 *
 * Normalizes the free-text core offerings from the research JSON
 * into standardized keys for filtering.
 */

export const CORE_OFFERINGS = {
  alquiler_canchas: "Alquiler de Canchas",
  clases: "Clases / Academia",
  torneos: "Torneos y Ligas",
  alquiler_equipamiento: "Alquiler de Equipamiento",
  eventos_corporativos: "Eventos Corporativos",
  tienda: "Tienda Especializada",
  cafeteria_bar: "Cafetería / Bar",
} as const;

export type CoreOfferingKey = keyof typeof CORE_OFFERINGS;

/** Maps research JSON offering text → normalized key */
const OFFERING_MAP: Record<string, CoreOfferingKey> = {
  "Alquiler de canchas": "alquiler_canchas",
  "Alquiler de canchas (pádel y tenis)": "alquiler_canchas",
  "Alquiler de canchas (pádel, fútbol, vóley)": "alquiler_canchas",
  "Alquiler de canchas (pádel, fútbol)": "alquiler_canchas",
  "Cancha pública de pádel": "alquiler_canchas",

  "Academia / Clases": "clases",
  Clases: "clases",
  "Clases personalizadas": "clases",
  "Academia para adultos y niños": "clases",
  "Clínicas de alto rendimiento": "clases",
  "Clases particulares": "clases",

  "Torneos y ligas": "torneos",
  Torneos: "torneos",
  Campeonatos: "torneos",

  "Alquiler de palas y pelotas": "alquiler_equipamiento",
  "Alquiler de palas": "alquiler_equipamiento",
  "Alquiler de equipamiento": "alquiler_equipamiento",

  "Eventos corporativos": "eventos_corporativos",

  "Tienda especializada": "tienda",
  "Tienda Padel Express": "tienda",
  "Tienda online (Babolat y Tecnifibre)": "tienda",

  "Cafetería / Bar": "cafeteria_bar",
  Piscina: "cafeteria_bar", // skip but map to avoid errors
};

/**
 * Normalize an array of raw core offering texts to standardized keys.
 * Deduplicates results.
 */
export function mapCoreOfferings(rawOfferings: string[]): string[] {
  const result = new Set<string>();

  for (const raw of rawOfferings) {
    const mapped = OFFERING_MAP[raw];
    if (mapped) {
      result.add(mapped);
    }
  }

  return [...result];
}
