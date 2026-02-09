import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@wifo/ui/button";
import { Separator } from "@wifo/ui/separator";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Como Funciona PadelHub | Reserva Canchas de Padel",
  description:
    "Descubre como PadelHub te ayuda a encontrar y reservar canchas de padel en Lima. Para jugadores y propietarios de canchas.",
};

const PLAYER_STEPS = [
  {
    number: "1",
    title: "Busca tu cancha",
    description:
      "Explora nuestro directorio de canchas de padel en Lima. Filtra por distrito, tipo de cancha (indoor/outdoor) y rango de precios.",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Compara opciones",
    description:
      "Revisa precios, horarios, amenidades y fotos de cada cancha. Encuentra la que mejor se ajuste a tus necesidades.",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    number: "3",
    title: "Reserva y juega",
    description:
      "Reserva tu cancha al instante desde la app. Llega, juega y disfruta. Sin llamadas, sin complicaciones.",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
];

const OWNER_STEPS = [
  {
    number: "1",
    title: "Registra tu local",
    description:
      "Crea tu cuenta de propietario y agrega la informacion de tu local: canchas, precios, horarios y fotos.",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Recibe reservas",
    description:
      "Los jugadores descubren tu cancha en PadelHub y reservan directamente. Gestiona todo desde el dashboard.",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    number: "3",
    title: "Haz crecer tu negocio",
    description:
      "Accede a analiticas, reduce cancelaciones y llena tus horarios vacios. Mas jugadores, mas ingresos.",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

export default function ComoFuncionaPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ name: "Como Funciona", href: "/como-funciona" }]}
      />

      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
          Como Funciona PadelHub
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          La forma mas facil de encontrar y reservar canchas de padel en Lima.
          Para jugadores y propietarios.
        </p>
      </div>

      {/* For Players */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
          Para Jugadores
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {PLAYER_STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl">
                {step.icon}
              </div>
              <div className="bg-secondary mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white">
                {step.number}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button size="lg" asChild>
            <Link href="/canchas">Buscar Canchas</Link>
          </Button>
        </div>
      </section>

      <Separator className="my-12" />

      {/* For Owners */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
          Para Propietarios
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {OWNER_STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <div className="bg-secondary/10 text-secondary mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl">
                {step.icon}
              </div>
              <div className="bg-primary mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white">
                {step.number}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/para-propietarios">Registrar Mi Local</Link>
          </Button>
        </div>
      </section>
    </Container>
  );
}
