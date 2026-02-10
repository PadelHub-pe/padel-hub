import type { Metadata } from "next";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { HowItWorksTabs } from "./how-it-works-tabs";

export const metadata: Metadata = {
  title: "Como Funciona PadelHub | Reserva Canchas de Padel",
  description:
    "Descubre como PadelHub te ayuda a encontrar y reservar canchas de padel en Lima. Para jugadores y propietarios de canchas.",
};

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

      <HowItWorksTabs />
    </Container>
  );
}
