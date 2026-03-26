import { Suspense } from "react";

import { SuccessPage } from "./_components/success-page";

interface PageProps {
  params: Promise<{ facilitySlug: string }>;
}

export default async function SuccessBookingPage({ params }: PageProps) {
  const { facilitySlug } = await params;

  return (
    <Suspense
      fallback={
        <main className="container pb-8">
          <div className="mt-8 flex flex-col items-center">
            <div className="bg-muted h-16 w-16 animate-pulse rounded-full" />
            <div className="bg-muted mt-4 h-8 w-48 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
          </div>
          <div className="bg-muted mt-6 h-20 animate-pulse rounded-lg" />
          <div className="bg-muted mt-4 h-40 animate-pulse rounded-lg" />
        </main>
      }
    >
      <SuccessPage facilitySlug={facilitySlug} />
    </Suspense>
  );
}
