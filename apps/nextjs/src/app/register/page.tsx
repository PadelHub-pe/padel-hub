"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signUp } from "@wifo/auth/client";
import { Button } from "@wifo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

import { useTRPC } from "~/trpc/react";

export default function RegisterPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    contactName: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const registerOwner = useMutation(
    trpc.owner.register.mutationOptions({
      onSuccess: () => {
        router.push("/onboarding");
      },
      onError: (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    })
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create Better Auth account
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.contactName,
      });

      if (result.error) {
        setError(result.error.message ?? "Error al crear la cuenta");
        setIsLoading(false);
        return;
      }

      // Step 2: Create owner account in our database
      registerOwner.mutate({
        contactName: formData.contactName,
        phone: formData.phone,
      });
    } catch {
      setError("Ocurrió un error inesperado. Intenta nuevamente.");
      setIsLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden flex-col justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-12 text-white lg:flex lg:w-1/2">
        <div className="max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-xl font-bold">
              P
            </div>
            <span className="text-2xl font-bold">PadelHub</span>
          </div>

          {/* Headline */}
          <h1 className="mb-4 text-4xl font-bold leading-tight">
            Registra tu Local de Padel
          </h1>

          {/* Tagline */}
          <p className="mb-10 text-lg text-blue-100">
            Conecta con jugadores, gestiona reservas y haz crecer tu negocio con
            la plataforma #1 de padel en Lima.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            <BenefitItem
              icon={<CalendarIcon />}
              text="Gestión de reservas en tiempo real"
            />
            <BenefitItem
              icon={<ChartIcon />}
              text="Analíticas e insights de tu negocio"
            />
            <BenefitItem
              icon={<UsersIcon />}
              text="Conecta con miles de jugadores"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="text-center lg:text-left">
            <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
            <CardDescription>
              Registra tus datos para comenzar a configurar tu centro de padel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="contactName">Tu nombre completo</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  minLength={2}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Tu teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+51 999 999 999"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contacto@miclub.pe"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BenefitItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
        {icon}
      </div>
      <span className="text-blue-50">{text}</span>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}
