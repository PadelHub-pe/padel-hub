import Link from "next/link";
import type { ComponentProps } from "react";

import { Button } from "@wifo/ui/button";

import { FacilityGrid } from "~/components/facility/facility-grid";
import { Section } from "~/components/layout/section";

type FacilityGridProps = ComponentProps<typeof FacilityGrid>;

interface FeaturedCourtsSectionProps {
  facilities: FacilityGridProps["facilities"];
}

export function FeaturedCourtsSection({
  facilities,
}: FeaturedCourtsSectionProps) {
  return (
    <Section id="canchas-destacadas">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold sm:text-4xl">
              Canchas Destacadas
            </h2>
            <p className="text-muted-foreground text-lg">
              Las mejores canchas de padel en Lima
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/canchas">Ver todas</Link>
          </Button>
        </div>

        <FacilityGrid facilities={facilities} mobileLimit={3} />

        <div className="mt-6 text-center sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/canchas">Ver todas las canchas</Link>
          </Button>
        </div>
    </Section>
  );
}
