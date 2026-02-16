"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";

interface AddPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  bookingStatus?: string;
  position: number | null;
  onPlayerAdded: () => void;
}

const guestPlayerSchema = z.object({
  guestName: z.string().min(1, "El nombre es requerido").max(100),
  guestEmail: z
    .string()
    .email("Email invalido")
    .optional()
    .or(z.literal("")),
  guestPhone: z.string().max(20).optional(),
});

type GuestPlayerFormValues = z.infer<typeof guestPlayerSchema>;

type TabMode = "search" | "guest";

export function AddPlayerDialog({
  open,
  onClose,
  bookingId,
  position,
  onPlayerAdded,
}: AddPlayerDialogProps) {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();
  const [activeTab, setActiveTab] = useState<TabMode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<GuestPlayerFormValues>({
    resolver: standardSchemaResolver(guestPlayerSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      guestPhone: "",
    },
  });

  // Debounce search query
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
  }, []);

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Reset state when dialog opens/closes via onOpenChange
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setActiveTab("search");
      setSearchQuery("");
      setDebouncedQuery("");
      form.reset();
      onClose();
    }
  };

  // Search users query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    ...trpc.booking.searchUsers.queryOptions({
      facilityId,
      bookingId,
      query: debouncedQuery || " ",
    }),
    enabled: open && debouncedQuery.length >= 1,
  });

  // Add player mutation
  const addPlayerMutation = useMutation(
    trpc.booking.addPlayer.mutationOptions({
      onSuccess: () => {
        toast.success("Jugador agregado");
        onPlayerAdded();
        onClose();
      },
      onError: (e) => {
        toast.error(e.message);
      },
    }),
  );

  const handleSelectUser = (userId: string) => {
    if (position === null) return;
    addPlayerMutation.mutate({
      facilityId,
      bookingId,
      position,
      userId,
    });
  };

  const handleGuestSubmit = (values: GuestPlayerFormValues) => {
    if (position === null) return;
    addPlayerMutation.mutate({
      facilityId,
      bookingId,
      position,
      guestName: values.guestName,
      guestEmail: values.guestEmail ?? undefined,
      guestPhone: values.guestPhone ?? undefined,
    });
  };

  if (position === null) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar jugador</DialogTitle>
          <DialogDescription>Posicion {position}</DialogDescription>
        </DialogHeader>

        {/* Tab buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === "search"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            Buscar usuario
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guest")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === "guest"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            Jugador invitado
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "search" ? (
          <div className="space-y-3">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
            />

            <div className="max-h-64 overflow-y-auto">
              {isSearching && debouncedQuery.length >= 1 && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  <span className="ml-2 text-sm text-gray-500">
                    Buscando...
                  </span>
                </div>
              )}

              {!isSearching &&
                debouncedQuery.length >= 1 &&
                searchResults?.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No se encontraron usuarios
                  </p>
                )}

              {!isSearching && debouncedQuery.length < 1 && (
                <p className="py-8 text-center text-sm text-gray-500">
                  Escribe para buscar usuarios
                </p>
              )}

              {searchResults && searchResults.length > 0 && (
                <ul className="space-y-1">
                  {searchResults.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectUser(user.id)}
                        disabled={addPlayerMutation.isPending}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-gray-100 disabled:opacity-50"
                      >
                        {/* Avatar with initials */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                          {getInitials(user.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleGuestSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="guestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Perez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guestEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guestPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="999 888 777" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addPlayerMutation.isPending}>
                  {addPlayerMutation.isPending
                    ? "Agregando..."
                    : "Agregar jugador"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}
