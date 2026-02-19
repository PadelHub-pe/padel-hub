"use client";

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

import type { TeamMemberRow } from "./team-columns";
import { useTRPC } from "~/trpc/react";

const editMemberSchema = z.object({
  role: z.enum(["org_admin", "facility_manager", "staff"]),
  facilityIds: z.array(z.string()),
});

type EditMemberFormValues = z.infer<typeof editMemberSchema>;

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  member: TeamMemberRow;
  facilities: { id: string; name: string }[];
}

export function EditMemberDialog({
  open,
  onOpenChange,
  organizationId,
  member,
  facilities,
}: EditMemberDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<EditMemberFormValues>({
    resolver: standardSchemaResolver(editMemberSchema),
    defaultValues: {
      role: member.role,
      facilityIds: member.facilityIds,
    },
  });

  const watchedRole = form.watch("role");

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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="org_admin">Administrador</SelectItem>
                      <SelectItem value="facility_manager">
                        Gerente de Local
                      </SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedRole !== "org_admin" && (
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
              <Button type="submit" disabled={updateMember.isPending}>
                {updateMember.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
