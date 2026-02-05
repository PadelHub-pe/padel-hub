"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTRPC } from "~/trpc/react";

const registerSchema = z
  .object({
    contactName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const form = useForm<RegisterFormValues>({
    resolver: standardSchemaResolver(registerSchema),
    defaultValues: {
      contactName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerOwner = useMutation(
    trpc.owner.register.mutationOptions({
      onSuccess: () => {
        router.push("/onboarding");
      },
      onError: (err) => {
        form.setError("root", { message: err.message });
      },
    }),
  );

  async function onSubmit(values: RegisterFormValues) {
    try {
      // Step 1: Create Better Auth account
      const result = await signUp.email({
        email: values.email,
        password: values.password,
        name: values.contactName,
      });

      if (result.error) {
        form.setError("root", {
          message: result.error.message ?? "Error al crear la cuenta",
        });
        return;
      }

      // Step 2: Create owner account in our database
      registerOwner.mutate({
        contactName: values.contactName,
        phone: values.phone,
      });
    } catch {
      form.setError("root", {
        message: "Ocurrió un error inesperado. Intenta nuevamente.",
      });
    }
  }

  const isLoading = form.formState.isSubmitting || registerOwner.isPending;

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Contact Name */}
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu nombre completo</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Juan Pérez"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu teléfono</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+51 999 999 999"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contacto@miclub.pe"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repite tu contraseña"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Root error message */}
                {form.formState.errors.root && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {form.formState.errors.root.message}
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
            </Form>

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
