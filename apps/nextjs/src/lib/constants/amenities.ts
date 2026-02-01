export const AMENITIES = [
  { id: "parking", label: "Estacionamiento", icon: "🅿️" },
  { id: "indoor", label: "Canchas Techadas", icon: "🏠" },
  { id: "outdoor", label: "Canchas al Aire Libre", icon: "☀️" },
  { id: "cafe", label: "Cafetería", icon: "☕" },
  { id: "showers", label: "Duchas", icon: "🚿" },
  { id: "lockers", label: "Casilleros", icon: "🔒" },
  { id: "pro_shop", label: "Pro Shop", icon: "🏪" },
  { id: "rental", label: "Alquiler de Equipos", icon: "🎾" },
  { id: "wifi", label: "Wi-Fi", icon: "📶" },
  { id: "accessible", label: "Accesible", icon: "♿" },
  { id: "lessons", label: "Clases/Entrenamiento", icon: "👨‍🏫" },
  { id: "air_conditioning", label: "Aire Acondicionado", icon: "❄️" },
] as const;

export type AmenityId = (typeof AMENITIES)[number]["id"];
