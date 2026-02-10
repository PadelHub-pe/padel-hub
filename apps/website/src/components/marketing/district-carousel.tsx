"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Section } from "~/components/layout/section";
import { DISTRICTS } from "./district-data";

/**
 * Dynamically import the Leaflet map (ssr: false) so it:
 * 1. Never runs on the server (Leaflet requires `window`)
 * 2. Code-splits into its own chunk (~40KB)
 * 3. Loads lazily after the page renders
 */
const DistrictMap = dynamic(() => import("./district-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/30 flex h-full w-full items-center justify-center rounded-2xl border">
      <div className="text-center">
        <div className="border-primary mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-muted-foreground text-sm">Cargando mapa...</p>
      </div>
    </div>
  ),
});

export function DistrictCarousel() {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const router = useRouter();

  function handleDistrictClick(slug: string) {
    router.push(`/canchas/${slug}`);
  }

  return (
    <Section id="distritos">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">
            Encuentra canchas <br className="lg:hidden" /> cerca de ti
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Explora los principales distritos de Lima con canchas de padel.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-5">
          {/* Interactive map (lazy-loaded, no SSR) */}
          <div className="lg:col-span-3">
            <div className="relative z-0 aspect-[4/3] overflow-hidden rounded-2xl border lg:aspect-auto lg:h-full lg:min-h-[420px]">
              <DistrictMap
                districts={DISTRICTS}
                activeDistrict={hoveredDistrict}
                onDistrictClick={handleDistrictClick}
              />
            </div>
          </div>

          {/* District list — renders immediately (SSR-friendly) */}
          <div className="lg:col-span-2">
            <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
              Distritos populares
            </h3>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {DISTRICTS.map((district) => {
                const isHovered = hoveredDistrict === district.name;

                return (
                  <Link
                    key={district.name}
                    href={`/canchas/${district.slug}`}
                    className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all duration-200 lg:justify-between lg:px-4 lg:py-3 ${
                      isHovered
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "hover:border-primary/20 hover:bg-muted/50 border-transparent"
                    }`}
                    onMouseEnter={() => setHoveredDistrict(district.name)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  >
                    <div className="flex items-center gap-2.5 lg:gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors lg:h-8 lg:w-8 ${
                          isHovered
                            ? "bg-primary text-white"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {district.courtCount}
                      </span>
                      <div className="min-w-0">
                        <span className="group-hover:text-primary block truncate text-sm font-semibold transition-colors">
                          {district.name}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {district.tagline}
                        </span>
                      </div>
                    </div>
                    <svg
                      className={`hidden h-4 w-4 shrink-0 transition-all lg:block ${
                        isHovered
                          ? "text-primary translate-x-0 opacity-100"
                          : "text-muted-foreground -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
    </Section>
  );
}
