import Link from "next/link";

import { Button } from "@wifo/ui/button";

export default function FacilityNotFound() {
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-4xl font-bold">404</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        No encontramos este local. Verifica el enlace e intenta de nuevo.
      </p>
      <Button asChild variant="outline" className="mt-4" size="sm">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
