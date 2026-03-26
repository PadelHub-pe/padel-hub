export function MisReservasSkeleton() {
  return (
    <main className="container pb-8">
      {/* Header */}
      <div className="mt-6">
        <div className="bg-muted h-7 w-40 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
      </div>

      {/* Phone form skeleton */}
      <div className="mt-6 space-y-4">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
        <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
        <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
      </div>
    </main>
  );
}
