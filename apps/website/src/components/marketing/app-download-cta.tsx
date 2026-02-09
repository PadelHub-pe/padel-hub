import { Button } from "@wifo/ui/button";

import { Container } from "~/components/layout/container";

const FEATURES = [
  {
    icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
    text: "Busca y reserva canchas al instante",
  },
  {
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    text: "Encuentra jugadores de tu nivel",
  },
  {
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    text: "Gestiona tus partidos y reservas",
  },
  {
    icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
    text: "Recibe alertas de horarios y ofertas",
  },
];

const COURT_PREVIEWS = [
  { name: "Padel Arena San Isidro", courts: 4, price: "S/ 80" },
  { name: "Club Padel Miraflores", courts: 3, price: "S/ 90" },
  { name: "Smash Padel Surco", courts: 6, price: "S/ 70" },
];

export function AppDownloadCTA() {
  return (
    <section className="relative overflow-hidden py-4 sm:py-20">
      {/* Subtle bg */}
      <div className="bg-muted/40 absolute inset-0" />

      <Container className="relative">
        {/* Card wrapper — contains everything in one cohesive unit */}
        <div className="bg-background relative overflow-hidden rounded-2xl lg:rounded-3xl">
          <div className="grid lg:grid-cols-5">
            {/* Left: content (3 cols) */}
            <div className="p-8 sm:p-10 lg:col-span-3 lg:p-12">
              {/* "En desarrollo" badge */}
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                En desarrollo
              </span>

              <h2 className="mb-3 text-3xl font-bold sm:text-4xl">
                Tu próxima app de pádel
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md text-base sm:text-lg">
                Estamos creando la mejor experiencia para reservar canchas,
                encontrar jugadores y organizar partidos desde tu celular.
              </p>

              {/* Feature list */}
              <ul className="mb-8 grid gap-3 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <li
                    key={feature.text}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <div className="bg-secondary/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                      <svg
                        className="text-secondary h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Store buttons (disabled) */}
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" variant="outline" disabled className="gap-2">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Próximamente
                </Button>
                <Button size="lg" variant="outline" disabled className="gap-2">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 12l2.302-3.492zM5.864 3.467L16.8 9.8l-2.302 2.302L5.864 3.467z" />
                  </svg>
                  Próximamente
                </Button>
              </div>

              <p className="mt-4 text-sm">
                <span className="text-muted-foreground">
                  ¿Quieres ser de los primeros?{" "}
                </span>
                <a
                  href="#lista-de-espera"
                  className="text-primary font-medium underline underline-offset-2"
                >
                  Únete a la lista de espera ↓
                </a>
              </p>
            </div>

            {/* Right: phone mockup (2 cols) — flush against card edge */}
            <div className="relative flex items-end justify-center lg:col-span-2">
              {/* Gradient bg behind phone */}
              <div className="from-primary/5 to-secondary/5 absolute inset-0 via-transparent" />

              {/* Phone — overflows bottom on desktop for a dynamic feel */}
              <div className="relative z-10 -mb-2 px-6 pt-8 sm:pt-10 lg:-mb-px lg:pt-8">
                <div className="border-foreground/90 bg-background relative mx-auto h-[420px] w-[210px] overflow-hidden rounded-t-[2rem] border-x-[5px] border-t-[5px] shadow-2xl sm:h-[460px] sm:w-[230px] lg:h-[480px] lg:w-[240px]">
                  {/* Status bar */}
                  <div className="bg-primary flex items-center justify-between px-4 pt-7 pb-1.5">
                    <span className="text-[10px] font-semibold text-white">
                      PadelHub
                    </span>
                    <span className="text-[8px] text-white/70">Lima, Perú</span>
                  </div>

                  {/* Screen content */}
                  <div className="space-y-2.5 p-3">
                    {/* Search bar */}
                    <div className="bg-muted/50 flex items-center gap-1.5 rounded-lg px-2.5 py-2">
                      <svg
                        className="text-muted-foreground h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                      </svg>
                      <span className="text-muted-foreground text-[10px]">
                        Buscar canchas...
                      </span>
                    </div>

                    {/* Mini court cards */}
                    {COURT_PREVIEWS.map((court) => (
                      <div
                        key={court.name}
                        className="bg-background rounded-lg border p-2.5"
                      >
                        <div className="from-primary/10 to-secondary/10 mb-1.5 h-12 rounded-md bg-gradient-to-br" />
                        <p className="text-[10px] leading-tight font-semibold">
                          {court.name}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-muted-foreground text-[8px]">
                            {court.courts} canchas
                          </span>
                          <span className="text-primary text-[10px] font-bold">
                            {court.price}/h
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom nav */}
                  <div className="bg-background absolute inset-x-0 bottom-0 flex items-center justify-around border-t px-1 pt-1.5 pb-3">
                    {["Inicio", "Buscar", "Reservas", "Perfil"].map(
                      (tab, i) => (
                        <div key={tab} className="flex flex-col items-center">
                          <div
                            className={`h-3 w-3 rounded-sm ${i === 0 ? "bg-primary" : "bg-muted"}`}
                          />
                          <span
                            className={`mt-0.5 text-[7px] ${i === 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}
                          >
                            {tab}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* "En construcción" overlay */}
                <div className="absolute inset-x-8 bottom-12 z-20 rounded-lg border border-amber-500/20 bg-amber-50/95 px-3 py-2 text-center backdrop-blur-sm sm:inset-x-10 dark:bg-amber-950/95">
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                    🚧 En construcción
                  </p>
                  <p className="text-[8px] text-amber-600/80 dark:text-amber-400/70">
                    Lanzamiento próximamente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
