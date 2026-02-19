"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import { toast } from "@wifo/ui/toast";

import type { AccessRequestRow } from "./access-requests-columns";
import { useTRPC } from "~/trpc/react";

interface FormState {
  organizationName: string;
  facilityName: string;
}

const INITIAL_FORM: FormState = {
  organizationName: "",
  facilityName: "",
};

export function ApproveDialog({
  request,
  open,
  onOpenChange,
}: {
  request: AccessRequestRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<{
    orgSlug: string;
    inviteToken: string;
  } | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const approveMutation = useMutation(
    trpc.admin.approveAccessRequest.mutationOptions({
      onSuccess: (data) => {
        setResult(data);
        toast.success("Solicitud aprobada exitosamente");
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.listAccessRequests.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.getStats.queryKey(),
        });
      },
    }),
  );

  function handleClose() {
    setResult(null);
    setForm(INITIAL_FORM);
    setErrors({});
    approveMutation.reset();
    onOpenChange(false);
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    const orgName = form.organizationName.trim();
    const facName = form.facilityName.trim();
    if (orgName.length < 2) newErrors.organizationName = "Mínimo 2 caracteres";
    else if (orgName.length > 200)
      newErrors.organizationName = "Máximo 200 caracteres";
    if (facName.length < 2) newErrors.facilityName = "Mínimo 2 caracteres";
    else if (facName.length > 200)
      newErrors.facilityName = "Máximo 200 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!request || !validate()) return;
    approveMutation.mutate({
      id: request.id,
      organizationName: form.organizationName.trim(),
      facilityName: form.facilityName.trim(),
    });
  }

  if (!request) return null;

  const dashboardUrl = (() => {
    if (typeof window === "undefined" || !result?.inviteToken) return "";
    const base = window.location.origin.replace(":3001", ":3000");
    const url = new URL("/register", base);
    url.searchParams.set("token", result.inviteToken);
    return url.toString();
  })();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Solicitud aprobada</DialogTitle>
              <DialogDescription>
                Se creó la organización y la invitación para {request.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Organización
                </p>
                <p className="text-sm">{result.orgSlug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Link de registro
                </p>
                <div className="mt-1 flex gap-2">
                  <code className="flex-1 rounded bg-gray-100 p-2 text-xs break-all">
                    {dashboardUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(dashboardUrl);
                      toast.success("Link copiado");
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Aprobar solicitud</DialogTitle>
              <DialogDescription>
                Define la organización y sede para{" "}
                <strong>{request.email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Read-only contact info from access request */}
              <div className="rounded-md bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Contacto
                </p>
                <p className="text-sm">
                  {request.name ?? "—"}{" "}
                  {request.phone && (
                    <span className="text-gray-500">· {request.phone}</span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Nombre de organización</Label>
                <Input
                  id="organizationName"
                  placeholder="Padel Club Lima"
                  value={form.organizationName}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      organizationName: e.target.value,
                    }));
                    setErrors((e) => ({ ...e, organizationName: undefined }));
                  }}
                />
                {errors.organizationName && (
                  <p className="text-sm text-red-500">
                    {errors.organizationName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityName">Nombre de sede</Label>
                <Input
                  id="facilityName"
                  placeholder="Sede Principal"
                  value={form.facilityName}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, facilityName: e.target.value }));
                    setErrors((e) => ({ ...e, facilityName: undefined }));
                  }}
                />
                {errors.facilityName && (
                  <p className="text-sm text-red-500">{errors.facilityName}</p>
                )}
              </div>
            </div>
            {approveMutation.error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {approveMutation.error.message}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending ? "Aprobando..." : "Aprobar"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
