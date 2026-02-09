import type { Metadata } from "next";
import { Card, CardContent } from "@wifo/ui/card";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { OwnerContactForm } from "~/components/lead-capture/owner-contact-form";

export const metadata: Metadata = {
  title: "Para Propietarios de Canchas | PadelHub",
  description:
    "Registra tu cancha de padel en PadelHub y llega a miles de jugadores en Lima. Gestion de reservas, analiticas y mas. Gratis para empezar.",
};

const BENEFITS = [
  {
    title: "Mas visibilidad",
    description:
      "Tu cancha aparece en el directorio de PadelHub, visible para miles de jugadores en Lima.",
    icon: "👁️",
  },
  {
    title: "Reservas online",
    description:
      "Los jugadores reservan directamente desde la web o app. Sin llamadas, sin WhatsApp.",
    icon: "📱",
  },
  {
    title: "Reduce cancelaciones",
    description:
      "Sistema de confirmacion y recordatorios automaticos para reducir no-shows.",
    icon: "✅",
  },
  {
    title: "Analiticas del negocio",
    description:
      "Dashboard con metricas de ocupacion, ingresos y comportamiento de tus clientes.",
    icon: "📊",
  },
  {
    title: "Llena horarios vacios",
    description:
      "Promociona horarios con baja demanda con precios especiales para atraer mas jugadores.",
    icon: "📅",
  },
  {
    title: "Sin costo inicial",
    description:
      "Registra tu cancha gratis. Solo pagas una comision cuando recibes reservas.",
    icon: "💰",
  },
];

export default function ParaPropietariosPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[
          { name: "Para Propietarios", href: "/para-propietarios" },
        ]}
      />

      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
          Haz crecer tu negocio de padel
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Unete a PadelHub y llega a miles de jugadores en Lima. Gestiona
          reservas, reduce cancelaciones y aumenta tus ingresos.
        </p>
      </div>

      {/* Benefits Grid */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Beneficios para tu negocio
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <Card key={benefit.title}>
              <CardContent className="p-6">
                <span className="mb-3 block text-3xl" role="img" aria-hidden>
                  {benefit.icon}
                </span>
                <h3 className="mb-2 text-lg font-semibold">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="mb-16">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-2 text-center text-2xl font-bold">
            Registra tu cancha
          </h2>
          <p className="text-muted-foreground mb-8 text-center">
            Completa el formulario y nos pondremos en contacto contigo en menos
            de 24 horas.
          </p>
          <Card>
            <CardContent className="p-6">
              <OwnerContactForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </Container>
  );
}
