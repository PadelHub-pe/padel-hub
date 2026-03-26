interface FacilityHeaderProps {
  name: string;
  address: string | null;
  district: string | null;
  description: string | null;
  courtCount: number;
}

export function FacilityHeader({
  name,
  address,
  district,
  description,
  courtCount,
}: FacilityHeaderProps) {
  return (
    <div className="mt-5 space-y-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {name}
        </h1>
        {(district ?? address) && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.307 11.307 0 00.757.433c.12.062.213.105.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                clipRule="evenodd"
              />
            </svg>
            {[district, address].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {/* Court count badge */}
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-3.5"
          >
            <path
              fillRule="evenodd"
              d="M9.674 2.075a.75.75 0 01.652 0l7.25 3.5A.75.75 0 0117 6.957V16.5h.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H3V6.957a.75.75 0 01-.576-1.382l7.25-3.5zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-6a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0110 7z"
              clipRule="evenodd"
            />
          </svg>
          {courtCount} {courtCount === 1 ? "cancha" : "canchas"}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
