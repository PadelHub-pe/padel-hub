"use client";

import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { toast } from "@wifo/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@wifo/ui/tooltip";

import type { TeamMemberRow } from "./team-columns";
import { useTRPC } from "~/trpc/react";

const editMemberSchema = z.object({
  role: z.enum(["org_admin", "facility_manager", "staff"]),
  facilityIds: z.array(z.string()),
});

type EditMemberFormValues = z.infer<typeof editMemberSchema>;
type Role = EditMemberFormValues["role"];

const ROLE_RANK: Record<Role, number> = {
  org_admin: 3,
  facility_manager: 2,
  staff: 1,
};

const DEMOTION_MESSAGES: Record<string, string> = {
  "org_admin->facility_manager":
    "Perderá acceso a la configuración de la organización y solo podrá gestionar los locales asignados.",
  "org_admin->staff":
    "Perderá acceso a la configuración de la organización y solo podrá operar reservas en los locales asignados.",
  "facility_manager->staff":
    "Solo podrá operar reservas y calendario en los locales asignados, sin acceso a configuración.",
};

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  member: TeamMemberRow;
  facilities: { id: string; name: string }[];
  adminCount: number;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  organizationId,
  member,
  facilities,
  adminCount,
}: EditMemberDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [demotionConfirmed, setDemotionConfirmed] = useState(false);

  const isLastAdmin = member.role === "org_admin" && adminCount <= 1;

  const form = useForm<EditMemberFormValues>({
    resolver: standardSchemaResolver(editMemberSchema),
    defaultValues: {
      role: member.role,
      facilityIds: member.facilityIds,
    },
  });

  const watchedRole = form.watch("role");
  const watchedFacilityIds = form.watch("facilityIds");

  const isDemotion = ROLE_RANK[watchedRole] < ROLE_RANK[member.role];
  const demotionKey = isDemotion ? `${member.role}->${watchedRole}` : null;
  const demotionMessage = demotionKey ? DEMOTION_MESSAGES[demotionKey] : null;

  const needsFacilities = watchedRole !== "org_admin";
  const hasFacilities = watchedFacilityIds.length > 0;
  const canSubmit =
    !isDemotion || demotionConfirmed
      ? needsFacilities
        ? hasFacilities
        : true
      : false;

  const updateMember = useMutation(
    trpc.org.updateMember.mutationOptions({
      onSuccess: () => {
        toast.success("Miembro actualizado");
        void queryClient.invalidateQueries(
          trpc.org.getTeamMembers.queryOptions({ organizationId }),
        );
        onOpenChange(false);
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: EditMemberFormValues) {
    updateMember.mutate({
      organizationId,
      memberId: member.id,
      role: values.role,
      facilityIds: values.role === "org_admin" ? [] : values.facilityIds,
    });
  }

  function handleRoleChange(
    newRole: string,
    fieldOnChange: (v: string) => void,
  ) {
    fieldOnChange(newRole);
    setDemotionConfirmed(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Miembro</DialogTitle>
          <DialogDescription>
            Cambia el rol y los locales asignados de {member.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={(v) => handleRoleChange(v, field.onChange)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="org_admin">Administrador</SelectItem>
                      {isLastAdmin ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <SelectItem value="facility_manager" disabled>
                                  Gerente de Local
                                </SelectItem>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              Es el único administrador
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <SelectItem value="staff" disabled>
                                  Staff
                                </SelectItem>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              Es el único administrador
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <>
                          <SelectItem value="facility_manager">
                            Gerente de Local
                          </SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isDemotion && demotionMessage && (
              <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
                <div className="space-y-2">
                  <p className="text-sm text-amber-800">{demotionMessage}</p>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={demotionConfirmed}
                      onCheckedChange={(checked) =>
                        setDemotionConfirmed(checked === true)
                      }
                    />
                    <span className="text-sm text-amber-700">
                      Confirmo el cambio de rol
                    </span>
                  </label>
                </div>
              </div>
            )}

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
                    {!hasFacilities && (
                      <p className="text-sm text-amber-600">
                        Selecciona al menos un local
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
                disabled={updateMember.isPending || !canSubmit}
              >
                {updateMember.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
