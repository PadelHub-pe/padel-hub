import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          type: "player",
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setErrorMessage(data.error ?? "Error al enviar. Intenta de nuevo.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMessage("Error de conexion. Intenta de nuevo.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div
        className="mx-auto max-w-[480px] text-center"
        role="alert"
        aria-live="polite"
      >
        <div className="bg-secondary/20 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl">
          <svg
            aria-hidden="true"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="font-display mb-2 text-xl font-semibold text-gray-900">
          ¡Te anotamos!
        </h3>
        <p className="text-sm text-gray-500">
          Te avisaremos cuando lancemos la app. Sin spam, lo prometemos.
        </p>
      </div>
    );
  }

  const inputClassName =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-secondary focus:ring-2 focus:ring-secondary/20";

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mx-auto mb-4 max-w-[520px] space-y-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            required
            aria-label="Tu nombre"
            className={inputClassName}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Celular (opcional)"
            aria-label="Celular"
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            aria-label="Tu email"
            className={inputClassName}
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="bg-secondary cursor-pointer rounded-xl border-none px-7 py-3.5 text-[15px] font-semibold whitespace-nowrap text-white transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(16,185,129,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {state === "loading" ? "Enviando..." : "Unirme a la lista"}
          </button>
        </div>
      </form>
      {state === "error" && (
        <p className="mb-3 text-center text-sm text-red-500" role="alert">
          {errorMessage}
        </p>
      )}
      <p className="text-center text-[13px] text-gray-400">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mr-1 inline-block align-middle"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Sin spam. Solo te avisaremos del lanzamiento.
      </p>
    </div>
  );
}
