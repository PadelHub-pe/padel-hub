import type { Metadata } from "next";
import { Card, CardContent } from "@wifo/ui/card";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { WaitlistForm } from "~/components/lead-capture/waitlist-form";

export const metadata: Metadata = {
  title: "Lista de Espera",
  description:
    "Unete a la lista de espera de PadelHub y se el primero en probar nuevas funcionalidades como partidos abiertos y reservas online.",
  alternates: {
    canonical: "/waitlist",
  },
};

export default function WaitlistPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ name: "Lista de Espera", href: "/waitlist" }]}
      />

      <div className="mx-auto max-w-md py-12 text-center">
        <div className="bg-primary/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <svg
            className="text-primary h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </div>

        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
          Unete a la Lista de Espera
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Se el primero en enterarte cuando lancemos nuevas funcionalidades
          como partidos abiertos, reservas online y mucho mas.
        </p>

        <Card>
          <CardContent className="p-6">
            <WaitlistForm source="waitlist-page" />
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-6 text-xs">
          No compartimos tu informacion con terceros. Puedes darte de baja en
          cualquier momento.
        </p>
      </div>
    </Container>
  );
}
