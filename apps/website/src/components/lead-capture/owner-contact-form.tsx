"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import { Textarea } from "@wifo/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";

import { LIMA_DISTRICTS_ALL } from "~/lib/constants";
import { useTRPC } from "~/trpc/react";

export function OwnerContactForm() {
  const trpc = useTRPC();
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    courtCount: "",
    district: "",
    message: "",
  });
  const [success, setSuccess] = useState(false);

  const submitInquiry = useMutation(
    trpc.publicLead.submitOwnerInquiry.mutationOptions({
      onSuccess: () => {
        setSuccess(true);
      },
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitInquiry.mutate({
      businessName: formData.businessName,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      courtCount: formData.courtCount ? parseInt(formData.courtCount) : undefined,
      district: formData.district || undefined,
      message: formData.message || undefined,
    });
  }

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  if (success) {
    return (
      <div className="rounded-lg border border-secondary/20 bg-secondary/10 p-6 text-center">
        <h3 className="text-secondary mb-2 text-lg font-semibold">
          Solicitud enviada
        </h3>
        <p className="text-muted-foreground text-sm">
          Nos pondremos en contacto contigo dentro de las proximas 24 horas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Nombre del negocio *
          </label>
          <Input
            value={formData.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            placeholder="Mi Club de Padel"
            required
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Nombre de contacto *
          </label>
          <Input
            value={formData.contactName}
            onChange={(e) => updateField("contactName", e.target.value)}
            placeholder="Juan Perez"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Email *
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="contacto@miclub.pe"
            required
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Telefono *
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+51 999 888 777"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Numero de canchas
          </label>
          <Input
            type="number"
            min="1"
            value={formData.courtCount}
            onChange={(e) => updateField("courtCount", e.target.value)}
            placeholder="4"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Distrito
          </label>
          <Select
            value={formData.district}
            onValueChange={(value) => updateField("district", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar distrito" />
            </SelectTrigger>
            <SelectContent>
              {LIMA_DISTRICTS_ALL.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-muted-foreground mb-1 block text-sm font-medium">
          Mensaje (opcional)
        </label>
        <Textarea
          value={formData.message}
          onChange={(e) => updateField("message", e.target.value)}
          placeholder="Cuentanos sobre tu negocio..."
          rows={3}
        />
      </div>

      {submitInquiry.error && (
        <p className="text-destructive text-sm">
          {submitInquiry.error.message}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitInquiry.isPending}
      >
        {submitInquiry.isPending ? "Enviando..." : "Enviar Solicitud"}
      </Button>
    </form>
  );
}
