"use client";

import { useState } from "react";
import Image from "next/image";

import { Container } from "~/components/layout/container";
import { HeroSearchTabs } from "./hero-search-tabs";

const HERO_IMAGES = {
  cancha: "/images/canva-padel-2.jpg",
  partido: "/images/canva-padel-1.jpg",
} as const;

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<"cancha" | "partido">("cancha");

  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      {/* Background images — both rendered, crossfade via opacity */}
      {Object.entries(HERO_IMAGES).map(([tab, src]) => (
        <Image
          key={tab}
          src={src}
          alt="Cancha de padel en Lima"
          fill
          className={`object-cover transition-opacity duration-700 ease-in-out ${
            activeTab === tab ? "opacity-100" : "opacity-0"
          }`}
          priority={tab === "cancha"}
          quality={85}
        />
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-700/60" />

      <Container className="relative z-10">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
            Encuentra tu cancha de{" "}
            <span className="rounded-xl bg-white px-3 pb-2 text-secondary">
              padel
            </span>{" "}
            ideal
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80 sm:text-xl">
            Descubre y reserva canchas de padel en Lima. Compara precios,
            horarios y encuentra jugadores de tu nivel.
          </p>
        </div>

        <HeroSearchTabs onTabChange={setActiveTab} />

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
          {[
            "Gratuito para jugadores",
            "10+ canchas en Lima",
            "Sin comision",
          ].map((text) => (
            <div key={text} className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {text}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
