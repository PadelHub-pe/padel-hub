"use client";

import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { changePassword } from "@wifo/auth/client";
import { Button } from "@wifo/ui/button";
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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Débil", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Regular", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Buena", color: "bg-yellow-500" };
  return { score, label: "Fuerte", color: "bg-green-500" };
}

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordValues>({
    resolver: standardSchemaResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = form.watch("newPassword");
  const strength = getPasswordStrength(newPasswordValue);

  async function onSubmit(values: ChangePasswordValues) {
    setIsSubmitting(true);
    try {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        const message = result.error.message ?? "";
        if (
          message.toLowerCase().includes("incorrect") ||
          message.toLowerCase().includes("invalid") ||
          message.toLowerCase().includes("wrong")
        ) {
          form.setError("currentPassword", {
            message: "Contraseña actual incorrecta",
          });
        } else {
          form.setError("root", {
            message: message || "Error al cambiar la contraseña",
          });
        }
        return;
      }

      toast.success("Contraseña actualizada");
      form.reset();
      onOpenChange(false);
    } catch {
      form.setError("root", {
        message: "Error al cambiar la contraseña",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y la nueva contraseña
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  {newPasswordValue.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${
                              i <= strength.score
                                ? strength.color
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Seguridad: {strength.label}
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-red-500">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Actualizando..." : "Cambiar Contraseña"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
