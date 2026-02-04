"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { CourtHeader } from "./court-header";
import { CourtInfoSection } from "./court-info-section";
import { CourtImageSection } from "./court-image-section";

interface CourtViewProps {
  id: string;
}

export function CourtView({ id }: CourtViewProps) {
  const trpc = useTRPC();

  const { data: court } = useSuspenseQuery(
    trpc.court.getById.queryOptions({ id }),
  );

  return (
    <div className="p-8">
      <CourtHeader courtId={id} courtName={court.name} />

      <div className="mt-8 space-y-6">
        <CourtImageSection
          imageUrl={court.imageUrl}
          status={court.status}
          type={court.type}
        />

        <CourtInfoSection
          name={court.name}
          status={court.status}
          type={court.type}
          description={court.description}
          priceInCents={court.priceInCents}
        />
      </div>
    </div>
  );
}
