"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
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
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTRPC } from "~/trpc/react";

const quickCreateSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  district: z.string().min(2, "El distrito es requerido"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  email: z.string().email("Email inválido").or(z.literal("")),
});

type QuickCreateFormValues = z.infer<typeof quickCreateSchema>;

interface QuickCreateFormProps {
  organizationId: string;
  orgSlug: string;
}

export function QuickCreateForm({ organizationId, orgSlug }: QuickCreateFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdFacility, setCreatedFacility] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const form = useForm<QuickCreateFormValues>({
    resolver: standardSchemaResolver(quickCreateSchema),
    defaultValues: {
      name: "",
      address: "",
      district: "",
      phone: "",
      email: "",
    },
  });

  const createFacility = useMutation(
    trpc.org.createFacility.mutationOptions({
      onSuccess: (data) => {
        setCreatedFacility(data);
        setShowSuccessDialog(true);
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  async function onSubmit(values: QuickCreateFormValues) {
    createFacility.mutate({
      organizationId,
      name: values.name,
      address: values.address,
      district: values.district,
      phone: values.phone,
      email: values.email || undefined,
    });
  }

  function handleGoToSetup() {
    if (createdFacility) {
      router.push(`/org/${orgSlug}/facilities/${createdFacility.id}/setup`);
    }
  }

  function handleSkipSetup() {
    router.push(`/org/${orgSlug}/facilities`);
  }

  const isLoading = createFacility.isPending;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nombre del local <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Padel Club Miraflores" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Dirección <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Av. Javier Prado Este 1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* District */}
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Distrito <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="San Isidro" {...field} />
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
                <FormLabel>
                  Teléfono <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+51 999 888 777" {...field} />
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
                <FormLabel>Email (opcional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contacto@miclub.pe" {...field} />
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
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/org/${orgSlug}/facilities`)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Creando..." : "Crear local"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Local creado exitosamente</DialogTitle>
            <DialogDescription>
              <span className="font-medium">{createdFacility?.name}</span> ha sido creado. Puedes
              configurar las canchas y horarios ahora o hacerlo más tarde.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button variant="outline" onClick={handleSkipSetup}>
              Configurar más tarde
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleGoToSetup}>
              Configurar ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
