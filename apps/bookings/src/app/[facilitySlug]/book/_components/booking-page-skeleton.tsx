export function BookingPageSkeleton() {
  return (
    <main className="container pb-8">
      {/* Back link */}
      <div className="bg-muted h-4 w-24 animate-pulse rounded" />

      {/* Title */}
      <div className="bg-muted mt-4 h-7 w-48 animate-pulse rounded" />
      <div className="bg-muted mt-2 h-4 w-32 animate-pulse rounded" />

      {/* Duration tabs */}
      <div className="mt-6 flex gap-2">
        <div className="bg-muted h-8 w-16 animate-pulse rounded-full" />
        <div className="bg-muted h-8 w-16 animate-pulse rounded-full" />
      </div>

      {/* Slot grid skeleton */}
      <div className="mt-6 space-y-6">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="bg-muted h-5 w-24 animate-pulse rounded" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div
                  key={j}
                  className="bg-muted h-16 animate-pulse rounded-lg"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
