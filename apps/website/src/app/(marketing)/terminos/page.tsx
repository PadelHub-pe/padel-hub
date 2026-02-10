import type { Metadata } from "next";
import Link from "next/link";

import { Separator } from "@wifo/ui/separator";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Terminos y Condiciones",
  description:
    "Terminos y condiciones de uso de PadelHub. Conoce tus derechos y obligaciones al usar nuestra plataforma de reservas de canchas de padel en Lima.",
  alternates: {
    canonical: "/terminos",
  },
};

const LAST_UPDATED = "9 de febrero de 2026";

const SECTIONS = [
  { id: "aceptacion", label: "Aceptacion" },
  { id: "definiciones", label: "Definiciones" },
  { id: "servicio", label: "Descripcion del servicio" },
  { id: "registro", label: "Registro y cuentas" },
  { id: "uso-aceptable", label: "Uso aceptable" },
  { id: "reservas", label: "Reservas y pagos" },
  { id: "propietarios", label: "Propietarios de canchas" },
  { id: "propiedad-intelectual", label: "Propiedad intelectual" },
  { id: "contenido-usuario", label: "Contenido del usuario" },
  { id: "limitacion", label: "Limitacion de responsabilidad" },
  { id: "indemnizacion", label: "Indemnizacion" },
  { id: "suspension", label: "Suspension y terminacion" },
  { id: "modificaciones", label: "Modificaciones" },
  { id: "ley-aplicable", label: "Ley aplicable" },
  { id: "contacto", label: "Contacto" },
];

export default function TerminosPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ name: "Terminos y Condiciones", href: "/terminos" }]}
      />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-10 max-w-3xl pt-4">
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
          Terminos y Condiciones
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
          {/* 1. Aceptacion */}
          <section id="aceptacion">
            <h2 className="mb-3 text-xl font-semibold">
              1. Aceptacion de los Terminos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Al acceder, navegar o utilizar el sitio web, la aplicacion movil o
              cualquier servicio de PadelHub (&quot;la Plataforma&quot;), aceptas
              y te comprometes a cumplir estos Terminos y Condiciones
              (&quot;Terminos&quot;). Si no estas de acuerdo con alguno de estos
              Terminos, debes abstenerte de utilizar la Plataforma.
            </p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Estos Terminos constituyen un acuerdo legal vinculante entre tu
              (&quot;Usuario&quot;) y PadelHub S.A.C. (&quot;PadelHub&quot;,
              &quot;nosotros&quot;), una sociedad constituida bajo las leyes de la
              Republica del Peru, con domicilio en Lima.
            </p>
          </section>

          <Separator />

          {/* 2. Definiciones */}
          <section id="definiciones">
            <h2 className="mb-3 text-xl font-semibold">2. Definiciones</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <tbody className="text-muted-foreground divide-y">
                  {[
                    {
                      term: "Plataforma",
                      def: "El sitio web padelhub.pe, la aplicacion movil PadelHub y todos los servicios asociados.",
                    },
                    {
                      term: "Jugador",
                      def: "Usuario que utiliza la Plataforma para buscar canchas, realizar reservas o participar en partidos abiertos.",
                    },
                    {
                      term: "Propietario",
                      def: "Usuario que administra una o mas instalaciones deportivas (canchas) a traves del dashboard de gestion.",
                    },
                    {
                      term: "Instalacion",
                      def: "Establecimiento deportivo que ofrece canchas de padel, registrado en la Plataforma.",
                    },
                    {
                      term: "Reserva",
                      def: "La solicitud confirmada de un Jugador para utilizar una cancha en una fecha y horario especificos.",
                    },
                    {
                      term: "Partido Abierto",
                      def: "Un partido organizado por un Jugador que busca otros participantes a traves de la Plataforma.",
                    },
                  ].map((item) => (
                    <tr key={item.term}>
                      <td className="text-foreground w-36 px-4 py-2.5 font-medium">
                        {item.term}
                      </td>
                      <td className="px-4 py-2.5">{item.def}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <Separator />

          {/* 3. Descripcion del servicio */}
          <section id="servicio">
            <h2 className="mb-3 text-xl font-semibold">
              3. Descripcion del Servicio
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              PadelHub es una plataforma tecnologica que conecta jugadores de
              padel con instalaciones deportivas en Lima, Peru. Nuestros
              servicios incluyen:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Directorio de canchas",
                  desc: "Busqueda y comparacion de instalaciones de padel por ubicacion, precio, tipo y disponibilidad.",
                },
                {
                  title: "Gestion de reservas",
                  desc: "Facilitacion del proceso de reserva entre jugadores e instalaciones deportivas.",
                },
                {
                  title: "Partidos abiertos",
                  desc: "Coordinacion de partidos donde jugadores buscan companeros para completar equipos.",
                },
                {
                  title: "Dashboard para propietarios",
                  desc: "Herramientas de gestion de instalaciones, canchas, horarios, reservas y analiticas.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border p-4">
                  <h3 className="mb-1 text-sm font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 mt-4 rounded-lg border border-amber-200 p-4">
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> PadelHub actua exclusivamente como
                intermediario tecnologico. No somos propietarios, operadores ni
                administradores de las instalaciones deportivas. La relacion
                contractual de la reserva se establece directamente entre el
                Jugador y la Instalacion.
              </p>
            </div>
          </section>

          <Separator />

          {/* 4. Registro y cuentas */}
          <section id="registro">
            <h2 className="mb-3 text-xl font-semibold">
              4. Registro y Cuentas de Usuario
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Para acceder a ciertas funcionalidades de la Plataforma, deberas
              crear una cuenta proporcionando informacion veraz y completa. Al
              registrarte, te comprometes a:
            </p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Proporcionar datos verdaderos, actuales y completos durante el
                registro
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Mantener actualizada tu informacion de perfil
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Mantener la confidencialidad de tus credenciales de acceso
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Notificarnos inmediatamente si detectas uso no autorizado de tu
                cuenta
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Ser mayor de 18 años de edad
              </li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              Eres responsable de todas las actividades que ocurran bajo tu
              cuenta. PadelHub no sera responsable por perdidas o daños
              derivados del uso no autorizado de tu cuenta.
            </p>
          </section>

          <Separator />

          {/* 5. Uso aceptable */}
          <section id="uso-aceptable">
            <h2 className="mb-3 text-xl font-semibold">
              5. Uso Aceptable de la Plataforma
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Te comprometes a utilizar la Plataforma de manera responsable y
              legal. Queda expresamente prohibido:
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-red-800">
                  Conductas prohibidas
                </h3>
                <ul className="space-y-1.5 text-sm text-red-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    Utilizar la Plataforma para fines ilegales o no autorizados
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    Publicar informacion falsa, engañosa o fraudulenta
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    Interferir con el funcionamiento de la Plataforma o sus
                    sistemas de seguridad
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    Realizar scraping, crawling o extraccion automatizada de
                    datos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    Suplantar la identidad de otra persona o entidad
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    Acosar, amenazar o discriminar a otros usuarios
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    Realizar reservas ficticias o no presentarse
                    reiteradamente sin cancelar
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          {/* 6. Reservas y pagos */}
          <section id="reservas">
            <h2 className="mb-3 text-xl font-semibold">
              6. Reservas y Pagos
            </h2>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Proceso de reserva</h3>
                <p className="text-muted-foreground text-sm">
                  PadelHub facilita el proceso de reserva entre Jugadores e
                  Instalaciones. Al realizar una reserva, el Jugador acepta las
                  condiciones especificas del establecimiento, incluyendo
                  politicas de cancelacion, horarios y normas de uso.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Pagos</h3>
                <p className="text-muted-foreground text-sm">
                  Los pagos por reservas se realizan directamente entre el
                  Jugador y la Instalacion, ya sea a traves de la plataforma de
                  pago de cada establecimiento o de forma presencial. PadelHub
                  no procesa pagos directamente en esta etapa. Los precios
                  mostrados son establecidos por cada Instalacion y pueden estar
                  sujetos a cambios sin previo aviso.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Cancelaciones</h3>
                <p className="text-muted-foreground text-sm">
                  Las politicas de cancelacion son definidas por cada
                  Instalacion. Te recomendamos revisar las condiciones
                  especificas de cancelacion antes de confirmar tu reserva.
                  PadelHub no es responsable por cargos derivados de
                  cancelaciones tardias o no presentaciones.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* 7. Propietarios de canchas */}
          <section id="propietarios">
            <h2 className="mb-3 text-xl font-semibold">
              7. Terminos para Propietarios de Canchas
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Los Propietarios que registren sus Instalaciones en la Plataforma
              se comprometen adicionalmente a:
            </p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Publicar informacion precisa sobre sus instalaciones (direccion,
                horarios, precios, fotos, amenidades)
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Mantener actualizada la disponibilidad de canchas y precios
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Honrar las reservas confirmadas a traves de la Plataforma
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Cumplir con todas las regulaciones municipales y nacionales
                aplicables a su establecimiento
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Mantener condiciones adecuadas de seguridad, higiene e
                infraestructura en sus instalaciones
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                No utilizar la Plataforma para actividades distintas a la
                gestion de instalaciones deportivas
              </li>
            </ul>
          </section>

          <Separator />

          {/* 8. Propiedad intelectual */}
          <section id="propiedad-intelectual">
            <h2 className="mb-3 text-xl font-semibold">
              8. Propiedad Intelectual
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo el contenido de la Plataforma, incluyendo pero no limitado a
              textos, graficos, logotipos, iconos, imagenes, software, codigo
              fuente, diseño, estructura y funcionalidades, es propiedad de
              PadelHub S.A.C. o de sus licenciantes y esta protegido por las
              leyes peruanas e internacionales de propiedad intelectual,
              incluyendo el Decreto Legislativo N° 822 (Ley sobre el Derecho de
              Autor) y la Decision Andina 486.
            </p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Se concede una licencia limitada, no exclusiva, no transferible y
              revocable para acceder y utilizar la Plataforma para fines
              personales y no comerciales. Queda prohibida la reproduccion,
              distribucion, modificacion o creacion de obras derivadas sin
              autorizacion expresa y por escrito de PadelHub.
            </p>
          </section>

          <Separator />

          {/* 9. Contenido del usuario */}
          <section id="contenido-usuario">
            <h2 className="mb-3 text-xl font-semibold">
              9. Contenido Generado por el Usuario
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Al publicar contenido en la Plataforma (reseñas, fotos,
              comentarios, informacion de perfil), otorgas a PadelHub una
              licencia no exclusiva, mundial, libre de regalias, sublicenciable
              y transferible para usar, reproducir, modificar, distribuir y
              mostrar dicho contenido en conexion con la operacion y promocion
              de la Plataforma.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Eres responsable del contenido que publicas y garantizas que no
              infringe derechos de terceros. PadelHub se reserva el derecho de
              eliminar contenido que considere inapropiado, ofensivo, falso o
              que viole estos Terminos, sin necesidad de previo aviso.
            </p>
          </section>

          <Separator />

          {/* 10. Limitacion de responsabilidad */}
          <section id="limitacion">
            <h2 className="mb-3 text-xl font-semibold">
              10. Limitacion de Responsabilidad
            </h2>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                <strong>
                  LA PLATAFORMA SE PROPORCIONA &quot;TAL CUAL&quot; Y &quot;SEGUN
                  DISPONIBILIDAD&quot;.
                </strong>{" "}
                En la maxima medida permitida por la ley peruana, PadelHub no
                sera responsable por:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                  Daños directos, indirectos, incidentales, especiales o
                  consecuentes derivados del uso de la Plataforma
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                  La calidad, seguridad, legalidad o condicion de las
                  instalaciones deportivas listadas
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                  La conducta de otros usuarios, tanto dentro como fuera de la
                  Plataforma
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                  Lesiones, accidentes o daños a la propiedad que ocurran en las
                  instalaciones deportivas
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                  Interrupciones del servicio, errores tecnicos o perdida de
                  datos
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                  La veracidad o exactitud de la informacion publicada por las
                  Instalaciones
                </li>
              </ul>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              En cualquier caso, la responsabilidad total de PadelHub frente al
              Usuario no excedera el monto pagado por el Usuario a PadelHub en
              los doce (12) meses anteriores al evento que genero la
              reclamacion.
            </p>
          </section>

          <Separator />

          {/* 11. Indemnizacion */}
          <section id="indemnizacion">
            <h2 className="mb-3 text-xl font-semibold">11. Indemnizacion</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aceptas indemnizar, defender y mantener indemne a PadelHub S.A.C.,
              sus directores, empleados, agentes y afiliados frente a cualquier
              reclamacion, demanda, daño, perdida, costo o gasto (incluyendo
              honorarios de abogados razonables) que surja de o este relacionado
              con: (a) tu uso de la Plataforma; (b) tu incumplimiento de estos
              Terminos; (c) tu violacion de derechos de terceros; o (d) el
              contenido que publiques en la Plataforma.
            </p>
          </section>

          <Separator />

          {/* 12. Suspension y terminacion */}
          <section id="suspension">
            <h2 className="mb-3 text-xl font-semibold">
              12. Suspension y Terminacion
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              PadelHub se reserva el derecho de suspender o cancelar tu cuenta y
              acceso a la Plataforma, sin previo aviso ni responsabilidad, en
              los siguientes casos:
            </p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Incumplimiento de estos Terminos o de nuestras politicas
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Actividades fraudulentas, ilegales o sospechosas
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                No presentaciones reiteradas a reservas confirmadas
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Conducta que perjudique la experiencia de otros usuarios o la
                reputacion de la Plataforma
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                Por requerimiento de autoridad competente
              </li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              Puedes cancelar tu cuenta en cualquier momento contactando a
              nuestro equipo. La cancelacion de la cuenta no exime de
              obligaciones pendientes.
            </p>
          </section>

          <Separator />

          {/* 13. Modificaciones */}
          <section id="modificaciones">
            <h2 className="mb-3 text-xl font-semibold">
              13. Modificaciones a los Terminos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              PadelHub se reserva el derecho de modificar estos Terminos en
              cualquier momento. Los cambios significativos seran notificados a
              traves del correo electronico registrado en tu cuenta o mediante un
              aviso visible en la Plataforma con al menos 15 dias de
              anticipacion. El uso continuado de la Plataforma despues de la
              fecha efectiva de los cambios constituye la aceptacion de los
              Terminos actualizados. Si no estas de acuerdo con los nuevos
              Terminos, deberas dejar de utilizar la Plataforma y cancelar tu
              cuenta.
            </p>
          </section>

          <Separator />

          {/* 14. Ley aplicable */}
          <section id="ley-aplicable">
            <h2 className="mb-3 text-xl font-semibold">
              14. Ley Aplicable y Jurisdiccion
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Estos Terminos se rigen e interpretan de conformidad con las leyes
              de la Republica del Peru. Para la resolucion de cualquier
              controversia derivada de estos Terminos, las partes acuerdan:
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <h3 className="mb-1 text-sm font-semibold">
                  1. Resolucion amigable
                </h3>
                <p className="text-muted-foreground text-sm">
                  En primera instancia, las partes intentaran resolver cualquier
                  disputa de manera directa y de buena fe, dentro de un plazo de
                  30 dias calendario.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-1 text-sm font-semibold">
                  2. Arbitraje o jurisdiccion ordinaria
                </h3>
                <p className="text-muted-foreground text-sm">
                  De no alcanzarse un acuerdo, las partes se someten a la
                  jurisdiccion de los juzgados y tribunales competentes del
                  Distrito Judicial de Lima, Peru, renunciando expresamente a
                  cualquier otro fuero que pudiera corresponderles.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* 15. Contacto */}
          <section id="contacto">
            <h2 className="mb-3 text-xl font-semibold">15. Contacto</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Si tienes preguntas o comentarios sobre estos Terminos y
              Condiciones, puedes contactarnos:
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email legal:</span>{" "}
                  <a
                    href="mailto:legal@padelhub.pe"
                    className="text-primary font-medium hover:underline"
                  >
                    legal@padelhub.pe
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
                <div>
                  <span className="text-muted-foreground">Direccion:</span>{" "}
                  Lima, Peru
                </div>
              </div>
            </div>
          </section>

          {/* Footer link */}
          <Separator />
          <div className="flex items-center justify-between pb-8">
            <Link
              href="/privacidad"
              className="text-primary text-sm font-medium hover:underline"
            >
              Ver Politica de Privacidad →
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
