const AMENITY_MAP: Record<string, { label: string; icon: string }> = {
  parking: { label: "Estacionamiento", icon: "🅿️" },
  estacionamiento: { label: "Estacionamiento", icon: "🅿️" },
  indoor: { label: "Techadas", icon: "🏠" },
  outdoor: { label: "Al Aire Libre", icon: "☀️" },
  cafe: { label: "Cafetería", icon: "☕" },
  cafeteria: { label: "Cafetería", icon: "☕" },
  showers: { label: "Duchas", icon: "🚿" },
  vestuarios: { label: "Vestuarios", icon: "🚿" },
  lockers: { label: "Casilleros", icon: "🔒" },
  pro_shop: { label: "Pro Shop", icon: "🏪" },
  tienda: { label: "Tienda", icon: "🏪" },
  rental: { label: "Alquiler de Equipos", icon: "🎾" },
  wifi: { label: "Wi-Fi", icon: "📶" },
  accessible: { label: "Accesible", icon: "♿" },
  lessons: { label: "Clases", icon: "👨‍🏫" },
  air_conditioning: { label: "Aire Acondicionado", icon: "❄️" },
  bar: { label: "Bar", icon: "🍺" },
  terraza: { label: "Terraza", icon: "🌿" },
};

interface AmenityListProps {
  amenities: string[];
}

export function AmenityList({ amenities }: AmenityListProps) {
  return (
    <div className="mt-4">
      <h2 className="text-sm font-medium">Servicios</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {amenities.map((amenity) => {
          const info = AMENITY_MAP[amenity];
          const label = info?.label ?? amenity;
          const icon = info?.icon ?? "✓";

          return (
            <span
              key={amenity}
              className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
