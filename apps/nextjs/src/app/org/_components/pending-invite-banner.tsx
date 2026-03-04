"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wifo/ui/card";

import { useTRPC } from "~/trpc/react";

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Administrador",
  facility_manager: "Gerente de sede",
  staff: "Staff",
};

interface PendingInviteBannerProps {
  /** Where to redirect if user skips all invites */
  redirectTo: string;
}

export function PendingInviteBanner({ redirectTo }: PendingInviteBannerProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: invites } = useSuspenseQuery(
    trpc.invite.getPendingInvites.queryOptions(),
  );

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptExisting = useMutation(
    trpc.invite.acceptExisting.mutationOptions({}),
  );

  const visibleInvites = invites.filter((inv) => !dismissedIds.has(inv.id));

  // All dismissed → redirect
  if (visibleInvites.length === 0) {
    router.replace(redirectTo);
    return null;
  }

  async function handleAccept(token: string, orgSlug: string) {
    setAcceptingToken(token);
    setError(null);
    try {
      await acceptExisting.mutateAsync({ token });
      router.replace(`/org/${orgSlug}/facilities`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al aceptar la invitación.",
      );
      setAcceptingToken(null);
    }
  }

  function handleDismiss(id: string) {
    setDismissedIds((prev) => new Set(prev).add(id));
  }

  function handleSkipAll() {
    router.replace(redirectTo);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Invitaciones pendientes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tienes{" "}
            {visibleInvites.length === 1
              ? "una invitación pendiente"
              : `${visibleInvites.length} invitaciones pendientes`}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {visibleInvites.map((invite) => (
          <Card key={invite.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {invite.organizationName}
                </CardTitle>
                <Badge variant="secondary">
                  {ROLE_LABELS[invite.role] ?? invite.role}
                </Badge>
              </div>
              <CardDescription>
                Te han invitado como{" "}
                <span className="font-medium">
                  {invite.roleLabel.toLowerCase()}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    handleAccept(invite.token, invite.organizationSlug)
                  }
                  disabled={acceptingToken !== null}
                >
                  {acceptingToken === invite.token ? "Aceptando..." : "Aceptar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDismiss(invite.id)}
                  disabled={acceptingToken !== null}
                >
                  Ahora no
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipAll}
            disabled={acceptingToken !== null}
          >
            Omitir todo
          </Button>
        </div>
      </div>
    </div>
  );
}
