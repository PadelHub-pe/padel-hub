import type { Metadata } from "next";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Terminos y Condiciones | PadelHub",
  description: "Terminos y condiciones de uso de PadelHub.",
};

export default function TerminosPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ name: "Terminos", href: "/terminos" }]}
      />

      <div className="prose mx-auto max-w-2xl">
        <h1>Terminos y Condiciones</h1>
        <p className="text-muted-foreground">
          Ultima actualizacion: Febrero 2026
        </p>

        <h2>1. Aceptacion de los Terminos</h2>
        <p>
          Al utilizar PadelHub, aceptas estos terminos y condiciones. Si no
          estas de acuerdo, por favor no utilices nuestros servicios.
        </p>

        <h2>2. Descripcion del Servicio</h2>
        <p>
          PadelHub es una plataforma que conecta jugadores de padel con
          instalaciones deportivas en Lima, Peru. Proporcionamos herramientas
          para descubrir canchas, comparar precios y gestionar reservas.
        </p>

        <h2>3. Uso del Servicio</h2>
        <p>Te comprometes a:</p>
        <ul>
          <li>Proporcionar informacion veraz y actualizada</li>
          <li>No utilizar el servicio con fines ilegales</li>
          <li>No interferir con el funcionamiento de la plataforma</li>
          <li>Respetar los derechos de otros usuarios</li>
        </ul>

        <h2>4. Reservas y Pagos</h2>
        <p>
          Las reservas realizadas a traves de PadelHub estan sujetas a las
          politicas de cada establecimiento. PadelHub actua como intermediario
          y no es responsable de la disponibilidad o condicion de las
          instalaciones.
        </p>

        <h2>5. Limitacion de Responsabilidad</h2>
        <p>
          PadelHub no se hace responsable de danos directos o indirectos que
          surjan del uso de la plataforma. El servicio se proporciona &quot;tal
          cual&quot;.
        </p>

        <h2>6. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos terminos en cualquier
          momento. Las modificaciones entraran en vigor al ser publicadas en
          esta pagina.
        </p>

        <h2>7. Contacto</h2>
        <p>
          Para consultas sobre estos terminos, escribenos a{" "}
          <a href="mailto:hola@padelhub.pe">hola@padelhub.pe</a>.
        </p>
      </div>
    </Container>
  );
}
