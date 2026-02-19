"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { signIn } from "@wifo/auth/client";
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

import { useTRPC } from "~/trpc/react";

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function InviteRegisterForm({ token }: { token: string }) {
  const router = useRouter();
  const trpc = useTRPC();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { data } = useSuspenseQuery(
    trpc.invite.validate.queryOptions({ token }),
  );

  // Invalid token states
  if (!data.valid) {
    return <InvalidTokenMessage error={data.error} />;
  }

  // User already has an account
  if (data.emailHasAccount) {
    return (
      <ExistingAccountMessage
        email={data.invite.email}
        organizationName={data.invite.organizationName}
        token={token}
      />
    );
  }

  return (
    <InviteForm
      token={token}
      email={data.invite.email}
      organizationName={data.invite.organizationName}
      roleLabel={data.invite.roleLabel}
      router={router}
      trpc={trpc}
      isGoogleLoading={isGoogleLoading}
      setIsGoogleLoading={setIsGoogleLoading}
    />
  );
}

function InviteForm({
  token,
  email,
  organizationName,
  roleLabel,
  router,
  trpc,
  isGoogleLoading,
  setIsGoogleLoading,
}: {
  token: string;
  email: string;
  organizationName: string;
  roleLabel: string;
  router: ReturnType<typeof useRouter>;
  trpc: ReturnType<typeof useTRPC>;
  isGoogleLoading: boolean;
  setIsGoogleLoading: (v: boolean) => void;
}) {
  const acceptMutation = useMutation(trpc.invite.accept.mutationOptions({}));

  const form = useForm<RegisterFormValues>({
    resolver: standardSchemaResolver(registerSchema),
    defaultValues: {
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      const result = await acceptMutation.mutateAsync({
        token,
        name: values.name,
        password: values.password,
      });

      if (result.success) {
        // Sign in with the new credentials
        const signInResult = await signIn.email({
          email,
          password: values.password,
        });

        if (signInResult.error) {
          // Account was created but sign-in failed — redirect to login
          router.push("/login");
        } else {
          router.push("/org");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado. Intenta nuevamente.";
      form.setError("root", { message });
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      // Store token for the callback page to use
      sessionStorage.setItem("invite_token", token);
      await signIn.social({
        provider: "google",
        callbackURL: "/register/callback",
      });
    } catch {
      setIsGoogleLoading(false);
      form.setError("root", {
        message: "Error al iniciar sesión con Google. Intenta nuevamente.",
      });
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
          <CardDescription>
            Completa tu registro para acceder a PadelHub
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invite banner */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Has sido invitado a <strong>{organizationName}</strong> como{" "}
              <strong>{roleLabel}</strong>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email (read-only) */}
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />
              </FormItem>

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu nombre completo</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Juan Pérez"
                        autoComplete="name"
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
                disabled={isSubmitting || isGoogleLoading}
              >
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">
                o continúa con
              </span>
            </div>
          </div>

          {/* Google OAuth button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <LoadingSpinner className="mr-2 h-5 w-5" />
            ) : (
              <GoogleIcon className="mr-2 h-5 w-5" />
            )}
            Google
          </Button>

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
  );
}

function InvalidTokenMessage({
  error,
}: {
  error: "invalid" | "used" | "expired";
}) {
  const messages = {
    invalid: {
      title: "Invitación no válida",
      description:
        "Este enlace de invitación no es válido. Verifica que hayas copiado el enlace completo.",
    },
    used: {
      title: "Invitación ya utilizada",
      description:
        "Esta invitación ya fue aceptada. Si ya creaste tu cuenta, inicia sesión.",
    },
    expired: {
      title: "Invitación expirada",
      description:
        "Esta invitación ha expirado. Solicita al administrador de tu organización que te envíe una nueva.",
    },
  };

  const { title, description } = messages[error];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertIcon className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Ir a iniciar sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ExistingAccountMessage({
  email,
  organizationName,
  token,
}: {
  email: string;
  organizationName: string;
  token: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <UserIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Ya tienes una cuenta</CardTitle>
          <CardDescription className="mt-2">
            El email <strong>{email}</strong> ya tiene una cuenta registrada.
            Inicia sesión para aceptar la invitación a{" "}
            <strong>{organizationName}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link
              href={`/login?redirect=/register/callback&invite_token=${token}`}
            >
              Iniciar sesión
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
