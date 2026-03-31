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
  alquiler_equipos: { label: "Alquiler de Equipos", icon: "🎾" },
  cafe_snacks: { label: "Café y Snacks", icon: "☕" },
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
    <section>
      <h2 className="font-display text-sm font-semibold tracking-wide uppercase">
        Servicios
      </h2>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {amenities.map((amenity) => {
          const info = AMENITY_MAP[amenity];
          const label = info?.label ?? amenity;
          const icon = info?.icon ?? "✓";

          return (
            <div
              key={amenity}
              className="border-border flex items-center gap-2.5 rounded-lg border px-3 py-2"
            >
              <span className="text-base" aria-hidden="true">
                {icon}
              </span>
              <span className="text-muted-foreground text-sm">{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
