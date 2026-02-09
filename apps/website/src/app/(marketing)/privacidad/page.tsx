import type { Metadata } from "next";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Politica de Privacidad | PadelHub",
  description: "Politica de privacidad de PadelHub.",
};

export default function PrivacidadPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ name: "Privacidad", href: "/privacidad" }]}
      />

      <div className="prose mx-auto max-w-2xl">
        <h1>Politica de Privacidad</h1>
        <p className="text-muted-foreground">
          Ultima actualizacion: Febrero 2026
        </p>

        <h2>1. Informacion que Recopilamos</h2>
        <p>
          En PadelHub recopilamos la informacion que nos proporcionas
          directamente, como tu nombre, correo electronico, numero de telefono y
          distrito al registrarte en nuestra lista de espera o al crear una
          cuenta.
        </p>

        <h2>2. Uso de la Informacion</h2>
        <p>Utilizamos tu informacion para:</p>
        <ul>
          <li>Proporcionarte acceso a nuestros servicios</li>
          <li>Enviarte notificaciones sobre nuevas funcionalidades</li>
          <li>Mejorar nuestros servicios</li>
          <li>Comunicarnos contigo sobre tu cuenta</li>
        </ul>

        <h2>3. Proteccion de Datos</h2>
        <p>
          Implementamos medidas de seguridad para proteger tu informacion
          personal. No compartimos tus datos con terceros sin tu consentimiento.
        </p>

        <h2>4. Tus Derechos</h2>
        <p>
          Tienes derecho a acceder, rectificar o eliminar tu informacion
          personal en cualquier momento. Contactanos en hola@padelhub.pe para
          ejercer estos derechos.
        </p>

        <h2>5. Cookies</h2>
        <p>
          Utilizamos cookies esenciales para el funcionamiento del sitio web.
          No utilizamos cookies de seguimiento o publicidad.
        </p>

        <h2>6. Contacto</h2>
        <p>
          Para consultas sobre privacidad, escribenos a{" "}
          <a href="mailto:hola@padelhub.pe">hola@padelhub.pe</a>.
        </p>
      </div>
    </Container>
  );
}
