/**
 * Amenity key mapping
 *
 * Maps raw amenity values from the research JSON to standardized DB keys.
 * The standardized keys match the AMENITIES constant in the website.
 */

/** Maps research JSON amenity strings → normalized DB amenity key */
const AMENITY_MAP: Record<string, string> = {
  // Parking variants → estacionamiento
  estacionamiento: "estacionamiento",
  estacionamiento_privado: "estacionamiento",
  estacionamiento_amplio: "estacionamiento",
  estacionamiento_gratuito: "estacionamiento",
  estacionamiento_28_espacios: "estacionamiento",
  estacionamiento_25_espacios: "estacionamiento",
  estacionamiento_vigilado: "estacionamiento",

  // Changing rooms / showers → vestuarios
  camerinos: "vestuarios",
  camerinos_con_duchas: "vestuarios",
  camerinos_con_duchas_agua_caliente: "vestuarios",
  camerinos_con_duchas_y_lockers: "vestuarios",

  // Cafeteria
  cafetería: "cafeteria",
  cafeteria: "cafeteria",

  // Store variants → tienda
  tienda_pro_shop: "tienda",
  tienda_especializada: "tienda",
  tienda_padel_express: "tienda",

  // Social / terrace
  terraza: "terraza",
  zona_social: "terraza",

  // Equipment rental
  alquiler_palas: "alquiler_equipamiento",
  alquiler_palas_y_pelotas: "alquiler_equipamiento",
  alquiler_equipamiento: "alquiler_equipamiento",

  // Stands
  graderías: "graderias",
  graderias: "graderias",

  // BBQ
  zona_parrilla: "parrilla",
};

/** Amenity keys to skip (not padel-related) */
const SKIP_AMENITIES = new Set([
  "canchas_futbol",
  "piscina",
  "complejo_1320m2",
]);

/**
 * Normalize an array of raw research amenity values to standardized DB keys.
 * Deduplicates and removes non-padel amenities.
 */
export function mapAmenities(rawAmenities: string[]): string[] {
  const result = new Set<string>();

  for (const raw of rawAmenities) {
    if (SKIP_AMENITIES.has(raw)) continue;
    const mapped = AMENITY_MAP[raw];
    if (mapped) {
      result.add(mapped);
    }
  }

  return [...result];
}
