import Link from "next/link";
import { Button } from "@wifo/ui/button";

import { Container } from "~/components/layout/container";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[60vh] items-center">
        <Container>
          <div className="mx-auto max-w-md py-16 text-center">
            <h1 className="text-primary mb-4 text-8xl font-bold">404</h1>
            <h2 className="mb-3 text-2xl font-semibold">
              Pagina no encontrada
            </h2>
            <p className="text-muted-foreground mb-8">
              La pagina que buscas no existe o fue movida. Intenta buscar
              canchas o vuelve al inicio.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/canchas">Buscar Canchas</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Ir al Inicio</Link>
              </Button>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
