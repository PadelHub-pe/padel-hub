"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@wifo/auth/client";
import { Button } from "@wifo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wifo/ui/card";

export function NoOrganizationView({ userEmail }: { userEmail: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <MailIcon className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Sin organización asignada</CardTitle>
          <CardDescription className="mt-2">
            Tu cuenta <strong>{userEmail}</strong> aún no pertenece a ninguna
            organización.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-gray-600">
            Si fuiste invitado, revisa tu correo electrónico para encontrar el
            enlace de invitación. Si crees que esto es un error, contacta al
            administrador de tu organización.
          </p>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>¿Necesitas ayuda?</strong> Escríbenos a{" "}
              <a
                href="mailto:soporte@padelhub.pe"
                className="underline hover:text-blue-900"
              >
                soporte@padelhub.pe
              </a>
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
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
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}
