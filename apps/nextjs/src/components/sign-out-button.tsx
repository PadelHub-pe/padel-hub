"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@wifo/auth/client";
import { Button } from "@wifo/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@wifo/ui/popover";
import { toast } from "@wifo/ui/toast";

export function SignOutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleConfirm() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      toast.error("Error al cerrar sesión. Intenta de nuevo.");
      setIsSigningOut(false);
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <LogoutIcon className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-56 border-gray-700 bg-gray-800 p-4"
      >
        <p className="mb-3 text-sm font-medium text-white">¿Cerrar sesión?</p>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isSigningOut}
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Cerrando..." : "Confirmar"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  );
}
