import { Container } from "~/components/layout/container";
import { WaitlistForm } from "~/components/lead-capture/waitlist-form";

const FEATURE_TAGS = [
  "Acceso anticipado",
  "Nuevas canchas",
  "Ofertas exclusivas",
  "Sin spam",
];

export function WaitlistCTASection() {
  return (
    <section
      id="lista-de-espera"
      className="relative overflow-hidden pt-10 pb-28"
    >
      {/* Background gradient + decorative elements */}
      <div className="from-primary/5 via-background to-secondary/5 absolute inset-0 bg-gradient-to-br" />
      <div className="bg-primary/5 absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-secondary/5 absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl" />

      <Container className="relative">
        <div className="mx-auto max-w-2xl">
          <div className="border-primary/10 bg-background/80 shadow-primary/5 rounded-2xl border p-8 shadow-xl backdrop-blur-sm sm:p-12">
            <div className="mb-8 text-center">
              {/* Icon */}
              <div className="bg-primary/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
                <svg
                  className="text-primary h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </div>
              <h2 className="mb-3 text-3xl font-bold sm:text-4xl">
                No te pierdas nada
              </h2>
              <p className="text-muted-foreground text-lg">
                Únete a la lista de espera y sé el primero en acceder a nuevas
                canchas, funciones exclusivas y ofertas especiales.
              </p>
            </div>

            {/* Feature pills */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              {FEATURE_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="border-primary/15 bg-primary/5 text-primary rounded-full border px-3.5 py-1.5 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            <WaitlistForm source="homepage-bottom" />

            <p className="text-muted-foreground mt-5 text-center text-xs">
              Más de{" "}
              <span className="text-foreground font-semibold">500+</span>{" "}
              jugadores ya están en la lista. Sin spam, lo prometemos.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
