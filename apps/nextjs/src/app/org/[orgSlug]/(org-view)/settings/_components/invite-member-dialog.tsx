"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Checkbox } from "@wifo/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

const ROLE_OPTIONS = [
  {
    value: "org_admin" as const,
    label: "Administrador",
    description: "Acceso total a la organizacion",
  },
  {
    value: "facility_manager" as const,
    label: "Manager de Local",
    description: "Gestiona y configura locales asignados",
  },
  {
    value: "staff" as const,
    label: "Staff",
    description: "Opera reservas y calendario en locales asignados",
  },
];

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["org_admin", "facility_manager", "staff"]),
  facilityIds: z.array(z.string()),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

type UserRole = "org_admin" | "facility_manager" | "staff";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  facilities: { id: string; name: string }[];
  userRole: UserRole;
  userFacilityIds: string[];
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationId,
  facilities,
  userRole,
}: InviteMemberDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const availableRoles =
    userRole === "facility_manager"
      ? ROLE_OPTIONS.filter((r) => r.value === "staff")
      : ROLE_OPTIONS;

  const defaultRole =
    userRole === "facility_manager" ? "staff" : "facility_manager";

  const form = useForm<InviteFormValues>({
    resolver: standardSchemaResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: defaultRole,
      facilityIds: [],
    },
  });

  const watchedRole = form.watch("role");
  const watchedFacilityIds = form.watch("facilityIds");

  const needsFacilities = watchedRole !== "org_admin";
  const missingFacilities = needsFacilities && watchedFacilityIds.length === 0;

  const inviteMember = useMutation(
    trpc.org.inviteMember.mutationOptions({
      onSuccess: () => {
        toast.success("Invitación enviada");
        void queryClient.invalidateQueries(
          trpc.org.getTeamMembers.queryOptions({ organizationId }),
        );
        form.reset({ email: "", role: defaultRole, facilityIds: [] });
        onOpenChange(false);
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: InviteFormValues) {
    inviteMember.mutate({
      organizationId,
      email: values.email,
      role: values.role,
      facilityIds: values.role === "org_admin" ? [] : values.facilityIds,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar Miembro</DialogTitle>
          <DialogDescription>
            Envía una invitación para unirse a la organización
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <div className="space-y-2">
                    {availableRoles.map((option) => (
                      <div
                        key={option.value}
                        role="radio"
                        aria-checked={field.value === option.value}
                        tabIndex={0}
                        className={cn(
                          "cursor-pointer rounded-lg border p-3 transition-colors",
                          field.value === option.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300",
                        )}
                        onClick={() => field.onChange(option.value)}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            field.onChange(option.value);
                          }
                        }}
                      >
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {option.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsFacilities && (
              <FormField
                control={form.control}
                name="facilityIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Locales asignados</FormLabel>
                    <div className="space-y-2">
                      {facilities.map((facility) => (
                        <FormField
                          key={facility.id}
                          control={form.control}
                          name="facilityIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes(facility.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value;
                                    field.onChange(
                                      checked
                                        ? [...current, facility.id]
                                        : current.filter(
                                            (id) => id !== facility.id,
                                          ),
                                    );
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm">{facility.name}</span>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    {missingFacilities && (
                      <p className="text-muted-foreground text-xs">
                        Selecciona al menos 1 local
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.formState.errors.root && (
              <div className="text-sm text-red-500">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={inviteMember.isPending || missingFacilities}
              >
                {inviteMember.isPending ? "Enviando..." : "Enviar Invitación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
