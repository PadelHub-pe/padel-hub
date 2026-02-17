"use client";

import { useState } from "react";

import { cn } from "@wifo/ui";

import { Section } from "~/components/layout/section";

const TESTIMONIALS = [
  {
    name: "Carlos M.",
    district: "Miraflores",
    skillLevel: "Cat 4",
    quote:
      "Antes perdia horas llamando a cada cancha. Con PadelHub encontre y reserve en minutos. Ahora juego 3 veces por semana.",
    avatar: "CM",
  },
  {
    name: "Maria L.",
    district: "San Isidro",
    skillLevel: "Cat 5",
    quote:
      "Lo mejor es poder comparar precios entre canchas. Encontre una cancha indoor a mitad de precio de lo que pagaba antes.",
    avatar: "ML",
  },
  {
    name: "Roberto S.",
    district: "Surco",
    skillLevel: "Cat 3",
    quote:
      "Excelente directorio. Descubri canchas nuevas que no conocia cerca a mi casa. La informacion de amenidades es super util.",
    avatar: "RS",
  },
  {
    name: "Ana P.",
    district: "La Molina",
    skillLevel: "Cat 6",
    quote:
      "Recien empece a jugar padel y PadelHub me ayudo a encontrar canchas con clases para principiantes. Totalmente recomendado.",
    avatar: "AP",
  },
];

export function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Section id="testimonios" className="py-16 sm:py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">
            Lo que dicen nuestros jugadores
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Jugadores en toda Lima confian en PadelHub para encontrar su cancha
            ideal.
          </p>
        </div>

        {/* Desktop: Grid of all testimonials */}
        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </div>

        {/* Mobile: Single card with dots */}
        <div className="md:hidden">
          {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- activeIndex always in bounds */}
          <TestimonialCard testimonial={TESTIMONIALS[activeIndex]!} />
          <div className="mt-6 flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === activeIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 w-2",
                )}
                aria-label={`Ver testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
    </Section>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
}) {
  return (
    <div className="bg-background rounded-xl border p-6">
      {/* Stars */}
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className="text-secondary h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p className="text-foreground mb-4 text-sm leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-medium">{testimonial.name}</p>
          <p className="text-muted-foreground text-xs">
            {testimonial.district} &middot; {testimonial.skillLevel}
          </p>
        </div>
      </div>
    </div>
  );
}
