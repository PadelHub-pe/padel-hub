export function FacilityLandingSkeleton() {
  return (
    <main className="pb-20">
      {/* Header skeleton */}
      <div className="container flex items-center justify-between py-3">
        <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
      </div>

      {/* Photo skeleton */}
      <div className="bg-muted -mx-4 aspect-[4/3] animate-pulse rounded-b-2xl" />

      <div className="container mt-5 space-y-5">
        {/* Facility info skeleton */}
        <div className="space-y-2.5">
          <div className="bg-muted h-7 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
          <div className="space-y-1.5">
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-4/5 animate-pulse rounded" />
          </div>
        </div>

        <div className="border-border border-t" />

        {/* Amenities skeleton */}
        <div className="space-y-2.5">
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted h-10 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>

        <div className="border-border border-t" />

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
      </div>

      {/* Sticky CTA skeleton */}
      <div className="bg-background fixed inset-x-0 bottom-0 border-t">
        <div className="mx-auto flex max-w-[480px] items-center gap-3 px-4 py-3">
          <div className="shrink-0 space-y-1">
            <div className="bg-muted h-3 w-8 animate-pulse rounded" />
            <div className="bg-muted h-4 w-16 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-11 flex-1 animate-pulse rounded-md" />
        </div>
      </div>
    </main>
  );
}
