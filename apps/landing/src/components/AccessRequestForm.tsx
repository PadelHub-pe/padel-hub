import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function AccessRequestForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setErrorMessage(data.error ?? "Error al enviar la solicitud");
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
      <div className="mx-auto max-w-[480px] text-center">
        <div className="bg-secondary/20 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl">
          ✅
        </div>
        <h3 className="font-display mb-2 text-xl font-semibold text-white">
          ¡Solicitud enviada!
        </h3>
        <p className="text-sm text-gray-400">
          Revisaremos tu solicitud en menos de 24 horas. Te enviaremos un email
          con los siguientes pasos.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mx-auto mb-6 flex max-w-[480px] flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          className="focus:border-primary focus:bg-primary/6 flex-1 rounded-[14px] border-[1.5px] border-white/12 bg-white/6 px-5 py-4 text-[15px] text-white transition-all outline-none placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="bg-primary hover:bg-primary-600 cursor-pointer rounded-[14px] border-none px-7 py-4 text-[15px] font-semibold whitespace-nowrap text-white transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(59,130,246,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "loading" ? "Enviando..." : "Solicitar Acceso"}
        </button>
      </form>
      {state === "error" && (
        <p className="mb-4 text-center text-sm text-red-400">{errorMessage}</p>
      )}
      <div className="text-center text-[13px] text-gray-500">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B7280"
          strokeWidth="2"
          className="mr-1 inline-block align-middle"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Revisamos cada solicitud en menos de 24 horas. Solo locales verificados.
      </div>
    </div>
  );
}
