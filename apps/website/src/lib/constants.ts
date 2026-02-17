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
  "Surquillo",
  "San Miguel",
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
  Surquillo: "surquillo",
  "San Miguel": "san-miguel",
  "Pueblo Libre": "pueblo-libre",
  "Jesus Maria": "jesus-maria",
  Magdalena: "magdalena",
  Chorrillos: "chorrillos",
};

/**
 * District descriptions for SEO and district pages
 */
export const DISTRICT_DESCRIPTIONS: Record<string, string> = {
  miraflores:
    "Zona turistica y residencial con canchas modernas cerca al malecon. Ideal para jugar con vista al mar despues del trabajo.",
  "san-isidro":
    "El distrito financiero de Lima ofrece instalaciones premium y canchas bien mantenidas en zonas de facil acceso.",
  surco:
    "Amplia zona residencial con la mayor variedad de clubes y academias de padel en Lima.",
  "la-molina":
    "Distrito residencial con clubes espaciosos y amplias areas verdes para disfrutar del deporte al aire libre.",
  barranco:
    "Barrio bohemio con canchas que combinan ambiente relajado y buena competencia entre jugadores locales.",
  "san-borja":
    "Distrito deportivo por excelencia, con instalaciones modernas y buena conectividad desde toda Lima.",
  surquillo:
    "Ubicacion centrica con opciones accesibles y facil acceso desde Miraflores, San Isidro y Surco.",
  "san-miguel":
    "Canchas cerca a la Costa Verde con buenas opciones para jugadores de todos los niveles.",
  "pueblo-libre":
    "Distrito historico con canchas accesibles y ambiente familiar para disfrutar del padel.",
  "jesus-maria":
    "Ubicacion estrategica en Lima moderna con opciones para jugadores que buscan conveniencia.",
  magdalena:
    "Distrito costero con canchas cercanas a la Costa Verde y ambiente tranquilo para jugar.",
  chorrillos:
    "Canchas en zona costera con precios competitivos y vistas unicas al Pacifico.",
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
  alquiler_equipamiento: { label: "Alquiler de Equipamiento", icon: "🏸" },
  parrilla: { label: "Zona de Parrilla", icon: "🔥" },
} as const;

export type AmenityKey = keyof typeof AMENITIES;

/**
 * Core offerings with display labels and icons
 * Based on packages/db/src/data/core-offerings.ts
 */
export const CORE_OFFERINGS = {
  alquiler_canchas: { label: "Alquiler de Canchas", icon: "🎾" },
  clases: { label: "Clases / Academia", icon: "🎓" },
  torneos: { label: "Torneos y Ligas", icon: "🏆" },
  alquiler_equipamiento: { label: "Alquiler de Equipamiento", icon: "🏸" },
  eventos_corporativos: { label: "Eventos Corporativos", icon: "🏢" },
  tienda: { label: "Tienda Especializada", icon: "🛒" },
  cafeteria_bar: { label: "Cafetería / Bar", icon: "☕" },
} as const;

export type CoreOfferingKey = keyof typeof CORE_OFFERINGS;

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
