/**
 * Lima district names for search, filters, and SEO pages
 * (subset with active padel courts)
 */
export const LIMA_DISTRICTS = [
  "Miraflores",
  "San Isidro",
  "Surco",
  "La Molina",
  "Barranco",
  "San Borja",
  "Pueblo Libre",
  "Jesus Maria",
  "Magdalena",
  "Chorrillos",
] as const;

export type LimaDistrict = (typeof LIMA_DISTRICTS)[number];

/**
 * All Lima districts — used in waitlist and owner contact forms
 * where we want to capture interest from any district.
 * Sorted alphabetically.
 */
export const LIMA_DISTRICTS_ALL = [
  "Ancón",
  "Ate",
  "Barranco",
  "Breña",
  "Carabayllo",
  "Chaclacayo",
  "Chorrillos",
  "Cieneguilla",
  "Comas",
  "El Agustino",
  "Independencia",
  "Jesús María",
  "La Molina",
  "La Victoria",
  "Lima Cercado",
  "Lince",
  "Los Olivos",
  "Lurigancho-Chosica",
  "Lurín",
  "Magdalena del Mar",
  "Miraflores",
  "Pachacámac",
  "Pucusana",
  "Pueblo Libre",
  "Puente Piedra",
  "Punta Hermosa",
  "Punta Negra",
  "Rímac",
  "San Bartolo",
  "San Borja",
  "San Isidro",
  "San Juan de Lurigancho",
  "San Juan de Miraflores",
  "San Luis",
  "San Martín de Porres",
  "San Miguel",
  "Santa Anita",
  "Santa María del Mar",
  "Santa Rosa",
  "Santiago de Surco",
  "Surquillo",
  "Villa El Salvador",
  "Villa María del Triunfo",
] as const;

/**
 * District slugs for URL routing
 */
export const DISTRICT_SLUGS: Record<string, string> = {
  Miraflores: "miraflores",
  "San Isidro": "san-isidro",
  Surco: "surco",
  "La Molina": "la-molina",
  Barranco: "barranco",
  "San Borja": "san-borja",
  "Pueblo Libre": "pueblo-libre",
  "Jesus Maria": "jesus-maria",
  Magdalena: "magdalena",
  Chorrillos: "chorrillos",
};

/**
 * Amenities with display labels and icons
 */
export const AMENITIES = {
  estacionamiento: { label: "Estacionamiento", icon: "🅿️" },
  vestuarios: { label: "Vestuarios", icon: "🚿" },
  cafeteria: { label: "Cafetería", icon: "☕" },
  tienda: { label: "Tienda", icon: "🛒" },
  iluminacion_led: { label: "Iluminación LED", icon: "💡" },
  aire_acondicionado: { label: "Aire Acondicionado", icon: "❄️" },
  wifi: { label: "Wi-Fi", icon: "📶" },
  bar: { label: "Bar", icon: "🍹" },
  terraza: { label: "Terraza", icon: "🌅" },
  clases: { label: "Clases", icon: "🎓" },
  video_analisis: { label: "Video Análisis", icon: "📹" },
  graderias: { label: "Graderías", icon: "🏟️" },
} as const;

export type AmenityKey = keyof typeof AMENITIES;

/**
 * Skill categories (6=beginner, 1=pro)
 */
export const SKILL_CATEGORIES = [
  { value: "6", label: "Categoría 6 - Principiante" },
  { value: "5", label: "Categoría 5 - Principiante-Intermedio" },
  { value: "4", label: "Categoría 4 - Intermedio" },
  { value: "3", label: "Categoría 3 - Intermedio-Avanzado" },
  { value: "2", label: "Categoría 2 - Avanzado" },
  { value: "1", label: "Categoría 1 - Profesional" },
] as const;

/**
 * Navigation links
 */
export const NAV_LINKS = [
  { href: "/canchas", label: "Canchas" },
  { href: "/como-funciona", label: "Cómo Funciona" },
  { href: "/para-propietarios", label: "Para Propietarios" },
] as const;

/**
 * Site URL
 */
export const SITE_URL = "https://padelhub.pe";

/**
 * App store URLs (placeholder until app is published)
 */
export const APP_STORE_URL = "#";
export const GOOGLE_PLAY_URL = "#";

/**
 * Social media links
 */
export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/padelhub_pe",
  facebook: "https://facebook.com/padelhub",
  tiktok: "https://tiktok.com/@padelhub_pe",
} as const;

/**
 * Contact info
 */
export const CONTACT = {
  email: "hola@padelhub.pe",
  phone: "+51 999 888 777",
  address: "Lima, Peru",
} as const;
