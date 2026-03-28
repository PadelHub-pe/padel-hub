import { useEffect, useState } from "react";

type Audience = "player" | "org";

const DISTRICTS = [
  { label: "Miraflores", slug: "miraflores" },
  { label: "San Isidro", slug: "san-isidro" },
  { label: "Santiago de Surco", slug: "surco" },
  { label: "La Molina", slug: "la-molina" },
  { label: "San Borja", slug: "san-borja" },
  { label: "Barranco", slug: "barranco" },
  { label: "Magdalena", slug: "magdalena" },
  { label: "Pueblo Libre", slug: "pueblo-libre" },
  { label: "Jesus Maria", slug: "jesus-maria" },
  { label: "Lince", slug: "lince" },
];

function CheckIcon() {
  return (
    <svg
      className="text-secondary h-4 w-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function HeroSection() {
  const [audience, setAudience] = useState<Audience>("player");
  const [district, setDistrict] = useState("");
  const [date, setDate] = useState("");

  const isPlayer = audience === "player";

  // Sync audience to <html> data attribute for CSS-driven section visibility
  useEffect(() => {
    document.documentElement.dataset.audience = audience;
  }, [audience]);

  // Listen for audience-switch events from navbar links
  useEffect(() => {
    function handleSwitch(e: Event) {
      const { audience: newAudience } = (
        e as CustomEvent<{ audience: Audience }>
      ).detail;
      setAudience(newAudience);
    }
    window.addEventListener("audience-switch", handleSwitch);
    return () => window.removeEventListener("audience-switch", handleSwitch);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (district) params.set("distrito", district);
    if (date) params.set("fecha", date);
    const query = params.toString();
    window.location.href = `https://bookings.padelhub.pe${query ? `?${query}` : ""}`;
  }

  return (
    <section className="relative overflow-hidden">
      {/* === Backgrounds (crossfade) === */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          isPlayer ? "opacity-100" : "opacity-0"
        }`}
      >
        <img
          src="/images/hero-players-1.jpg"
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      <div
        className={`absolute inset-0 bg-gradient-to-br from-white via-[#F0F7FF] to-[#E8F4FD] transition-opacity duration-700 ease-in-out ${
          !isPlayer ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-none absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-[100px] -left-[100px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_70%)]" />
      </div>

      {/* === Content === */}
      <div className="relative z-10 px-4 pt-28 pb-16 sm:px-8 sm:pt-40 sm:pb-24">
        {/* Toggle Pill */}
        <div className="mx-auto mb-10 flex justify-center">
          <div
            className={`relative inline-flex rounded-full p-1 transition-all duration-500 ${
              isPlayer
                ? "bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-md"
                : "bg-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
            }`}
          >
            <div
              className="absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-out"
              style={{
                width: "calc(50% - 4px)",
                left: isPlayer ? "4px" : "calc(50%)",
              }}
            />
            <button
              type="button"
              onClick={() => setAudience("player")}
              className={`relative z-10 cursor-pointer rounded-full border-none bg-transparent px-5 py-2.5 text-sm font-semibold transition-colors duration-300 sm:px-6 ${
                isPlayer ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Soy Jugador
            </button>
            <button
              type="button"
              onClick={() => setAudience("org")}
              className={`relative z-10 cursor-pointer rounded-full border-none bg-transparent px-5 py-2.5 text-sm font-semibold transition-colors duration-300 sm:px-6 ${
                !isPlayer ? "text-gray-900" : "text-white/75 hover:text-white"
              }`}
            >
              Tengo un Club
            </button>
          </div>
        </div>

        {/* Tab content (overlapping grid for crossfade) */}
        <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
          {/* Player tab */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              isPlayer
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0"
            }`}
          >
            <div className="mx-auto max-w-[700px] text-center">
              <h1 className="font-display mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-white lg:text-[56px]">
                Encuentra tu cancha de{" "}
                <span className="from-secondary bg-gradient-to-r to-[#34D399] bg-clip-text text-transparent">
                  padel
                </span>{" "}
                ideal
              </h1>

              <p className="mx-auto mb-10 max-w-[500px] text-lg leading-relaxed text-white/85">
                Descubre y reserva canchas en Lima. Compara precios, horarios y
                encuentra la cancha perfecta para ti.
              </p>

              {/* Search form */}
              <form
                onSubmit={handleSearch}
                className="mx-auto mb-8 flex max-w-[600px] flex-col gap-3 sm:flex-row"
              >
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] border-white/15 bg-white/10 px-5 py-4 text-[15px] text-white backdrop-blur-sm transition-all outline-none [&>option]:text-gray-900"
                >
                  <option value="">Todos los distritos</option>
                  {DISTRICTS.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.label}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 rounded-[14px] border-[1.5px] border-white/15 bg-white/10 px-5 py-4 text-[15px] text-white [color-scheme:dark] backdrop-blur-sm transition-all outline-none"
                />

                <button
                  type="submit"
                  className="bg-secondary hover:bg-secondary-600 cursor-pointer rounded-[14px] border-none px-7 py-4 text-[15px] font-semibold whitespace-nowrap text-white shadow-[0_2px_8px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(16,185,129,0.35)]"
                >
                  Buscar Canchas
                </button>
              </form>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  Gratuito para jugadores
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  10+ canchas en Lima
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  Sin comision
                </span>
              </div>
            </div>
          </div>

          {/* Org tab */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              !isPlayer
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0"
            }`}
          >
            <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Left: Content */}
              <div>
                <div className="border-secondary-200 bg-secondary-100 text-secondary-800 mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 pr-3.5 pl-2 text-[13px] font-medium">
                  <div className="animate-pulse-dot bg-secondary h-2 w-2 rounded-full" />
                  Beta activa en Lima
                </div>

                <h1 className="font-display mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-gray-900 lg:text-[52px]">
                  Llena tus canchas con{" "}
                  <span className="from-primary bg-gradient-to-br to-[#6366F1] bg-clip-text text-transparent">
                    jugadores reales
                  </span>
                </h1>

                <p className="mb-10 max-w-[500px] text-lg leading-relaxed text-gray-500">
                  PadelHub conecta tu local con miles de jugadores buscando
                  donde jugar. Tu gestionas tus canchas, nosotros te traemos la
                  demanda.
                </p>

                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <a
                    href="#solicitar"
                    className="bg-primary hover:bg-primary-600 inline-flex items-center gap-2 rounded-[14px] px-8 py-4 text-base font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.35)]"
                  >
                    Solicitar Acceso
                    <ArrowIcon />
                  </a>
                  <a
                    href="#organizaciones"
                    className="inline-flex items-center gap-2 rounded-[14px] border-[1.5px] border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
                  >
                    Ver como funciona
                  </a>
                </div>
              </div>

              {/* Right: Dashboard mockup (desktop only) */}
              <div className="relative hidden lg:block">
                <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.08),0_24px_60px_rgba(0,0,0,0.06)]">
                  {/* Top bar */}
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FCA5A5]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FCD34D]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#6EE7B7]" />
                  </div>
                  {/* Content area */}
                  <div className="grid min-h-[340px] grid-cols-[200px_1fr] gap-5 p-6">
                    {/* Sidebar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="bg-primary-100 text-primary flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium">
                        <div className="h-4 w-4 rounded bg-current opacity-30" />
                        Vista General
                      </div>
                      {[
                        "Reservas",
                        "Canchas",
                        "Horarios",
                        "Precios",
                        "Configuracion",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-500"
                        >
                          <div className="h-4 w-4 rounded bg-current opacity-30" />
                          {item}
                        </div>
                      ))}
                    </div>
                    {/* Main */}
                    <div className="flex flex-col gap-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-[10px] border border-gray-100 bg-gray-50 p-3.5">
                          <div className="font-display text-xl font-bold text-gray-900">
                            127
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-500">
                            Reservas este mes
                          </div>
                        </div>
                        <div className="rounded-[10px] border border-gray-100 bg-gray-50 p-3.5">
                          <div className="font-display text-secondary text-xl font-bold">
                            89%
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-500">
                            Ocupacion
                          </div>
                        </div>
                        <div className="rounded-[10px] border border-gray-100 bg-gray-50 p-3.5">
                          <div className="font-display text-primary text-xl font-bold">
                            S/ 18.4k
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-500">
                            Ingresos
                          </div>
                        </div>
                      </div>
                      {/* Chart */}
                      <div className="flex flex-1 flex-col overflow-hidden rounded-[10px] border border-gray-100 bg-gray-50 p-4">
                        <div className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                          Reservas por dia
                        </div>
                        <div className="mt-3 flex flex-1 items-end gap-1.5 px-2">
                          {[
                            { h: "45%", color: "bg-primary-100" },
                            { h: "65%", color: "bg-primary-100" },
                            { h: "55%", color: "bg-primary-100" },
                            { h: "85%", color: "bg-primary" },
                            { h: "90%", color: "bg-primary" },
                            {
                              h: "95%",
                              color:
                                "bg-gradient-to-t from-[#6366F1] to-primary",
                            },
                            { h: "78%", color: "bg-primary" },
                          ].map((bar, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-t ${bar.color}`}
                              style={{ height: bar.h }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating card 1 */}
                <div className="animate-float absolute -bottom-4 -left-10 z-20 flex items-center gap-3 rounded-2xl bg-white p-3.5 px-4.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                  <div className="bg-secondary-100 flex h-10 w-10 items-center justify-center rounded-[10px] text-lg">
                    🎾
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900">
                      +3 reservas nuevas
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Desde la app de jugadores
                    </div>
                  </div>
                </div>

                {/* Floating card 2 */}
                <div className="animate-float-delayed absolute top-5 -right-8 z-20 flex items-center gap-2.5 rounded-[14px] bg-white p-3 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                  <div className="bg-warning-light flex h-10 w-10 items-center justify-center rounded-[10px] text-base">
                    ⚡
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">
                      Hora pico activa
                    </div>
                    <div className="text-[11px] text-gray-500">
                      18:00 – 21:00
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
