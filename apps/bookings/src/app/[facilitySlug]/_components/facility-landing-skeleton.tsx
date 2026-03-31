export function FacilityLandingSkeleton() {
  return (
    <main className="pb-24">
      {/* Header skeleton */}
      <div className="container flex items-center justify-between py-3">
        <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
      </div>

      {/* Compact hero skeleton */}
      <div className="bg-muted -mx-4 h-[160px] animate-pulse" />

      <div className="container mt-5 space-y-5">
        {/* Date selector skeleton */}
        <div className="space-y-3">
          <div className="bg-muted h-6 w-48 animate-pulse rounded" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted h-16 w-14 flex-none animate-pulse rounded-xl"
              />
            ))}
          </div>
        </div>

        {/* Duration tabs skeleton */}
        <div className="space-y-2">
          <div className="bg-muted h-4 w-16 animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="bg-muted h-9 w-16 animate-pulse rounded-full" />
            <div className="bg-muted h-9 w-24 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Slots skeleton */}
        <div className="space-y-5">
          <div className="bg-muted h-4 w-40 animate-pulse rounded" />
          {Array.from({ length: 2 }).map((_, courtIdx) => (
            <div key={courtIdx} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                <div className="bg-muted h-5 w-14 animate-pulse rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, slotIdx) => (
                  <div
                    key={slotIdx}
                    className="bg-muted h-16 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
