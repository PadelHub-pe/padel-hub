"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";

import { LIMA_DISTRICTS_ALL } from "~/lib/constants";
import { useTRPC } from "~/trpc/react";

type WaitlistSource =
  | "homepage"
  | "homepage-bottom"
  | "directory"
  | "facility"
  | "footer"
  | "footer-newsletter"
  | "waitlist-page";

export function WaitlistForm({
  source = "homepage",
  compact = false,
}: {
  source?: WaitlistSource;
  compact?: boolean;
}) {
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [success, setSuccess] = useState(false);

  const joinWaitlist = useMutation(
    trpc.publicLead.joinWaitlist.mutationOptions({
      onSuccess: () => {
        setSuccess(true);
        setName("");
        setEmail("");
        setPhone("");
        setDistrict("");
      },
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    joinWaitlist.mutate({
      name: name || undefined,
      email,
      phone: phone || undefined,
      district: district || undefined,
      source,
    });
  }

  if (success) {
    return (
      <div className="rounded-lg border border-secondary/20 bg-secondary/10 p-4 text-center">
        <p className="text-secondary font-semibold">
          Te has unido a la lista de espera
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Te notificaremos cuando lancemos nuevas funcionalidades.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={joinWaitlist.isPending}
        >
          {joinWaitlist.isPending ? "..." : "Unirme"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="text"
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="given-name"
      />
      <Input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="tel"
        placeholder="Teléfono (opcional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Select value={district} onValueChange={setDistrict}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Distrito (opcional)" />
        </SelectTrigger>
        <SelectContent>
          {LIMA_DISTRICTS_ALL.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {joinWaitlist.error && (
        <p className="text-destructive text-sm">
          {joinWaitlist.error.message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={joinWaitlist.isPending}
      >
        {joinWaitlist.isPending ? "Registrando..." : "Unirme a la Lista de Espera"}
      </Button>
    </form>
  );
}
