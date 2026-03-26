export function FacilityLandingSkeleton() {
  return (
    <main className="container pb-8">
      {/* Photo skeleton */}
      <div className="bg-muted -mx-4 aspect-[4/3] animate-pulse" />

      {/* Header skeleton */}
      <div className="mt-5 space-y-3">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
        <div className="space-y-1.5">
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-4/5 animate-pulse rounded" />
        </div>
      </div>

      {/* Amenities skeleton */}
      <div className="mt-4 space-y-2">
        <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted h-6 w-20 animate-pulse rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Date selector skeleton */}
      <div className="mt-6 space-y-3">
        <div className="bg-muted h-6 w-40 animate-pulse rounded" />
        <div className="bg-muted mx-auto h-72 w-full animate-pulse rounded-lg" />
        <div className="bg-muted h-11 w-full animate-pulse rounded-md" />
      </div>
    </main>
  );
}
