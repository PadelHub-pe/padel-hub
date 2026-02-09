import { Section } from "~/components/layout/section";

const STEPS = [
  {
    number: "1",
    title: "Descubre",
    description:
      "Explora canchas de padel en tu distrito. Filtra por tipo, precio y amenidades.",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Reserva",
    description:
      "Elige el horario que prefieras y reserva tu cancha en segundos. Sin llamadas.",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    ),
  },
  {
    number: "3",
    title: "Juega",
    description:
      "Llega a la cancha y disfruta tu partido. Encuentra jugadores de tu nivel.",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
        />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <Section id="como-funciona" className="sm:py-20">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="mb-2 text-2xl font-bold sm:mb-3 sm:text-4xl">
            Como Funciona
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-sm sm:text-lg">
            Reservar tu cancha de padel nunca fue tan facil. Solo 3 pasos.
          </p>
        </div>

        {/* Mobile: horizontal cards with connecting line */}
        <div className="relative sm:hidden">
          {/* Vertical connecting line */}
          <div className="absolute top-6 bottom-6 left-6 w-px bg-border" />

          <div className="relative space-y-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm"
              >
                {/* Icon with step number badge */}
                <div className="relative shrink-0">
                  <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                    {step.icon}
                  </div>
                  <span className="bg-secondary absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm">
                    {step.number}
                  </span>
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-sm font-semibold leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: centered columns */}
        <div className="hidden sm:grid sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                {step.icon}
              </div>
              <div className="bg-secondary mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
                {step.number}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
    </Section>
  );
}
