import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { CONTACT, SOCIAL_LINKS } from "~/lib/constants";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contactanos para consultas, sugerencias o soporte. Estamos aqui para ayudarte.",
  alternates: {
    canonical: "/contacto",
  },
};

export default function ContactoPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ name: "Contacto", href: "/contacto" }]} />

      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Contacto</h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-lg">
          Tienes alguna pregunta o sugerencia? Nos encantaria saber de ti.
        </p>
      </div>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-primary text-lg hover:underline"
            >
              {CONTACT.email}
            </a>
            <p className="text-muted-foreground mt-2 text-sm">
              Respondemos en menos de 24 horas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telefono</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`tel:${CONTACT.phone}`}
              className="text-primary text-lg hover:underline"
            >
              {CONTACT.phone}
            </a>
            <p className="text-muted-foreground mt-2 text-sm">
              Lunes a Viernes, 9am - 6pm.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary block hover:underline"
            >
              Instagram: @padelhub_pe
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary block hover:underline"
            >
              Facebook: /padelhub
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary block hover:underline"
            >
              TikTok: @padelhub_pe
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicacion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{CONTACT.address}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Operamos 100% digital en toda Lima Metropolitana.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
