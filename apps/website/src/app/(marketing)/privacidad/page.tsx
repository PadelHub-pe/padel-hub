import type { Metadata } from "next";
import Link from "next/link";

import { Separator } from "@wifo/ui/separator";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Politica de Privacidad",
  description:
    "Conoce como PadelHub protege tu informacion personal. Cumplimos con la Ley 29733 de Proteccion de Datos Personales del Peru.",
  alternates: {
    canonical: "/privacidad",
  },
};

const LAST_UPDATED = "9 de febrero de 2026";

const SECTIONS = [
  { id: "introduccion", label: "Introduccion" },
  { id: "responsable", label: "Responsable del tratamiento" },
  { id: "datos-recopilados", label: "Datos que recopilamos" },
  { id: "finalidad", label: "Finalidad del tratamiento" },
  { id: "base-legal", label: "Base legal" },
  { id: "compartir", label: "Compartir informacion" },
  { id: "almacenamiento", label: "Almacenamiento y seguridad" },
  { id: "derechos", label: "Tus derechos ARCO" },
  { id: "cookies", label: "Cookies y tecnologias" },
  { id: "menores", label: "Menores de edad" },
  { id: "transferencia", label: "Transferencia internacional" },
  { id: "cambios", label: "Cambios a esta politica" },
  { id: "contacto", label: "Contacto" },
];

export default function PrivacidadPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ name: "Politica de Privacidad", href: "/privacidad" }]}
      />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-10 max-w-3xl pt-4">
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
          Politica de Privacidad
        </h1>
        <p className="text-muted-foreground">
          Ultima actualizacion: {LAST_UPDATED}
        </p>
      </div>

      {/* ── Layout: sidebar + content ──────────────────────── */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        {/* Table of contents — desktop only */}
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              Contenido
            </p>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-muted-foreground hover:text-primary block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-blue-50/50"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Content */}
        <article className="max-w-3xl space-y-10">
          {/* 1. Introduccion */}
          <section id="introduccion">
            <h2 className="mb-3 text-xl font-semibold">1. Introduccion</h2>
            <p className="text-muted-foreground leading-relaxed">
              En PadelHub (&quot;nosotros&quot;, &quot;nuestro&quot; o la
              &quot;Plataforma&quot;) nos comprometemos a proteger la privacidad
              y los datos personales de nuestros usuarios. Esta Politica de
              Privacidad describe como recopilamos, usamos, almacenamos y
              protegemos tu informacion personal cuando utilizas nuestro sitio
              web, aplicacion movil y servicios relacionados (conjuntamente, los
              &quot;Servicios&quot;).
            </p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Esta politica cumple con la{" "}
              <strong>Ley N° 29733 — Ley de Proteccion de Datos Personales</strong>{" "}
              del Peru y su Reglamento aprobado mediante Decreto Supremo N°
              003-2013-JUS, asi como las disposiciones de la Autoridad Nacional
              de Proteccion de Datos Personales (ANPDP).
            </p>
          </section>

          <Separator />

          {/* 2. Responsable */}
          <section id="responsable">
            <h2 className="mb-3 text-xl font-semibold">
              2. Responsable del Tratamiento
            </h2>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Empresa:</span>{" "}
                  <strong>PadelHub S.A.C.</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Domicilio:</span>{" "}
                  Lima, Peru
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <a
                    href="mailto:privacidad@padelhub.pe"
                    className="text-primary hover:underline"
                  >
                    privacidad@padelhub.pe
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground">Sitio web:</span>{" "}
                  <a
                    href="https://padelhub.pe"
                    className="text-primary hover:underline"
                  >
                    padelhub.pe
                  </a>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* 3. Datos que recopilamos */}
          <section id="datos-recopilados">
            <h2 className="mb-3 text-xl font-semibold">
              3. Datos que Recopilamos
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Recopilamos diferentes tipos de datos segun como interactues con
              nuestros Servicios:
            </p>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">
                  Datos proporcionados directamente
                </h3>
                <ul className="text-muted-foreground space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    <span>
                      <strong>Registro de cuenta:</strong> nombre completo,
                      correo electronico, numero de telefono, distrito de
                      residencia
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    <span>
                      <strong>Perfil de jugador:</strong> categoria de juego,
                      preferencias de horario, foto de perfil (opcional)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    <span>
                      <strong>Propietarios de canchas:</strong> datos del
                      establecimiento, direccion, horarios, precios, fotos de
                      instalaciones
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    <span>
                      <strong>Lista de espera:</strong> nombre, correo
                      electronico, distrito, fuente de referencia
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">
                  Datos recopilados automaticamente
                </h3>
                <ul className="text-muted-foreground space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    <span>
                      <strong>Datos de uso:</strong> paginas visitadas,
                      funcionalidades utilizadas, frecuencia y duracion de uso
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    <span>
                      <strong>Datos del dispositivo:</strong> tipo de
                      dispositivo, sistema operativo, navegador, direccion IP
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    <span>
                      <strong>Ubicacion general:</strong> ciudad o distrito
                      derivado de la direccion IP (no geolocalizacion precisa
                      sin consentimiento)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          {/* 4. Finalidad */}
          <section id="finalidad">
            <h2 className="mb-3 text-xl font-semibold">
              4. Finalidad del Tratamiento
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Tratamos tus datos personales para las siguientes finalidades:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Prestacion del servicio",
                  desc: "Gestionar tu cuenta, procesar reservas, facilitar la conexion entre jugadores e instalaciones.",
                },
                {
                  title: "Comunicaciones",
                  desc: "Enviarte confirmaciones de reservas, recordatorios, actualizaciones de la plataforma y notificaciones relevantes.",
                },
                {
                  title: "Mejora del servicio",
                  desc: "Analizar patrones de uso para mejorar la experiencia, desarrollar nuevas funcionalidades y optimizar el rendimiento.",
                },
                {
                  title: "Seguridad",
                  desc: "Prevenir fraude, proteger la integridad de la plataforma y garantizar la seguridad de las transacciones.",
                },
                {
                  title: "Obligaciones legales",
                  desc: "Cumplir con requerimientos legales, regulatorios y fiscales aplicables en Peru.",
                },
                {
                  title: "Marketing (con consentimiento)",
                  desc: "Enviarte ofertas, promociones y contenido relevante sobre padel. Puedes darte de baja en cualquier momento.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border p-4">
                  <h3 className="mb-1 text-sm font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* 5. Base legal */}
          <section id="base-legal">
            <h2 className="mb-3 text-xl font-semibold">
              5. Base Legal del Tratamiento
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              El tratamiento de tus datos personales se realiza bajo las
              siguientes bases legales, conforme a la Ley N° 29733:
            </p>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong>Consentimiento:</strong> otorgado al registrarte y
                  aceptar esta politica.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong>Ejecucion contractual:</strong> necesario para
                  prestarte los Servicios contratados.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong>Interes legitimo:</strong> para mejorar nuestros
                  servicios y prevenir fraude.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong>Cumplimiento legal:</strong> para cumplir con
                  obligaciones regulatorias y fiscales.
                </span>
              </li>
            </ul>
          </section>

          <Separator />

          {/* 6. Compartir */}
          <section id="compartir">
            <h2 className="mb-3 text-xl font-semibold">
              6. Compartir Informacion con Terceros
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              <strong>No vendemos tus datos personales.</strong> Solo
              compartimos tu informacion en los siguientes supuestos:
            </p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong>Instalaciones deportivas:</strong> compartimos datos
                  necesarios para gestionar tu reserva (nombre, telefono) con el
                  establecimiento donde reservaste.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong>Proveedores de servicios:</strong> empresas que nos
                  ayudan a operar la plataforma (hosting, analitica, envio de
                  correos), bajo acuerdos de confidencialidad.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong>Requerimiento legal:</strong> cuando sea exigido por
                  autoridades competentes conforme a ley.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong>Proteccion de derechos:</strong> para proteger
                  nuestros derechos, seguridad o propiedad, y los de nuestros
                  usuarios.
                </span>
              </li>
            </ul>
          </section>

          <Separator />

          {/* 7. Almacenamiento */}
          <section id="almacenamiento">
            <h2 className="mb-3 text-xl font-semibold">
              7. Almacenamiento y Seguridad
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Implementamos medidas de seguridad tecnicas, organizativas y
              legales para proteger tus datos personales contra acceso no
              autorizado, perdida, alteracion o destruccion:
            </p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Cifrado de datos en transito (TLS/SSL) y en reposo
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Controles de acceso basados en roles para nuestro equipo
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Copias de seguridad periodicas y planes de recuperacion
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Revision periodica de nuestras practicas de seguridad
              </li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Conservamos tus datos personales mientras mantengas tu cuenta
              activa o sea necesario para prestarte los Servicios. Tras la
              eliminacion de tu cuenta, podemos retener ciertos datos por un
              periodo adicional para cumplir con obligaciones legales o resolver
              disputas.
            </p>
          </section>

          <Separator />

          {/* 8. Derechos ARCO */}
          <section id="derechos">
            <h2 className="mb-3 text-xl font-semibold">
              8. Tus Derechos (ARCO)
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Conforme a la Ley N° 29733, tienes los siguientes derechos sobre
              tus datos personales:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  letter: "A",
                  title: "Acceso",
                  desc: "Solicitar informacion sobre que datos personales tuyos tenemos almacenados y como los utilizamos.",
                },
                {
                  letter: "R",
                  title: "Rectificacion",
                  desc: "Solicitar la correccion de datos personales inexactos, incompletos o desactualizados.",
                },
                {
                  letter: "C",
                  title: "Cancelacion",
                  desc: "Solicitar la eliminacion de tus datos personales cuando ya no sean necesarios para la finalidad.",
                },
                {
                  letter: "O",
                  title: "Oposicion",
                  desc: "Oponerte al tratamiento de tus datos personales para determinadas finalidades, como marketing.",
                },
              ].map((right) => (
                <div key={right.letter} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="bg-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white">
                      {right.letter}
                    </span>
                    <h3 className="font-semibold">{right.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{right.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-muted/50 mt-4 rounded-lg p-4">
              <p className="text-sm">
                Para ejercer cualquiera de estos derechos, envia un correo a{" "}
                <a
                  href="mailto:privacidad@padelhub.pe"
                  className="text-primary font-medium hover:underline"
                >
                  privacidad@padelhub.pe
                </a>{" "}
                indicando tu nombre, correo asociado a tu cuenta y el derecho
                que deseas ejercer. Responderemos en un plazo maximo de{" "}
                <strong>10 dias habiles</strong>.
              </p>
            </div>
          </section>

          <Separator />

          {/* 9. Cookies */}
          <section id="cookies">
            <h2 className="mb-3 text-xl font-semibold">
              9. Cookies y Tecnologias Similares
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Utilizamos cookies y tecnologias similares para:
            </p>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                    <th className="px-4 py-2.5 text-left font-medium">
                      Finalidad
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium">
                      Duracion
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground divide-y">
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      Esenciales
                    </td>
                    <td className="px-4 py-2.5">
                      Funcionamiento basico, autenticacion, seguridad
                    </td>
                    <td className="px-4 py-2.5">Sesion</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      Funcionales
                    </td>
                    <td className="px-4 py-2.5">
                      Recordar preferencias y configuracion
                    </td>
                    <td className="px-4 py-2.5">1 año</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      Analiticas
                    </td>
                    <td className="px-4 py-2.5">
                      Entender como se usa la plataforma y mejorar la
                      experiencia
                    </td>
                    <td className="px-4 py-2.5">2 años</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No utilizamos cookies de publicidad ni de seguimiento de terceros.
              Puedes configurar tu navegador para rechazar cookies, aunque esto
              puede afectar la funcionalidad del servicio.
            </p>
          </section>

          <Separator />

          {/* 10. Menores */}
          <section id="menores">
            <h2 className="mb-3 text-xl font-semibold">
              10. Menores de Edad
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Nuestros Servicios estan dirigidos a personas mayores de 18 años.
              No recopilamos intencionalmente datos personales de menores de
              edad. Si un padre o tutor considera que hemos recopilado datos de
              un menor, puede contactarnos para solicitar su eliminacion
              inmediata.
            </p>
          </section>

          <Separator />

          {/* 11. Transferencia internacional */}
          <section id="transferencia">
            <h2 className="mb-3 text-xl font-semibold">
              11. Transferencia Internacional de Datos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Tus datos pueden ser almacenados en servidores ubicados fuera del
              Peru (por ejemplo, servicios de cloud computing). En estos casos,
              nos aseguramos de que el pais de destino ofrezca un nivel adecuado
              de proteccion de datos personales o adoptamos las garantias
              contractuales necesarias, conforme a lo establecido por la ANPDP.
            </p>
          </section>

          <Separator />

          {/* 12. Cambios */}
          <section id="cambios">
            <h2 className="mb-3 text-xl font-semibold">
              12. Cambios a esta Politica
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos actualizar esta Politica de Privacidad periodicamente. Te
              notificaremos sobre cambios significativos a traves del correo
              electronico registrado en tu cuenta o mediante un aviso visible en
              la Plataforma. La fecha de &quot;Ultima actualizacion&quot; al
              inicio de este documento refleja la version vigente. El uso
              continuado de los Servicios despues de los cambios constituye la
              aceptacion de la politica actualizada.
            </p>
          </section>

          <Separator />

          {/* 13. Contacto */}
          <section id="contacto">
            <h2 className="mb-3 text-xl font-semibold">13. Contacto</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Si tienes preguntas, comentarios o solicitudes relacionadas con
              esta Politica de Privacidad o el tratamiento de tus datos
              personales, puedes contactarnos:
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email de privacidad:</span>{" "}
                  <a
                    href="mailto:privacidad@padelhub.pe"
                    className="text-primary font-medium hover:underline"
                  >
                    privacidad@padelhub.pe
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground">Email general:</span>{" "}
                  <a
                    href="mailto:hola@padelhub.pe"
                    className="text-primary font-medium hover:underline"
                  >
                    hola@padelhub.pe
                  </a>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Tambien puedes presentar una reclamacion ante la{" "}
              <strong>
                Autoridad Nacional de Proteccion de Datos Personales (ANPDP)
              </strong>{" "}
              del Ministerio de Justicia y Derechos Humanos del Peru si
              consideras que tus derechos han sido vulnerados.
            </p>
          </section>

          {/* Footer link */}
          <Separator />
          <div className="flex items-center justify-between pb-8">
            <Link
              href="/terminos"
              className="text-primary text-sm font-medium hover:underline"
            >
              Ver Terminos y Condiciones →
            </Link>
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} PadelHub S.A.C.
            </p>
          </div>
        </article>
      </div>
    </Container>
  );
}
