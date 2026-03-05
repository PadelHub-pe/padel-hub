"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "@wifo/ui/toast";

const MESSAGES: Record<string, string> = {
  "no-access": "No tienes acceso a ese local",
};

export function RedirectToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get("message");

  useEffect(() => {
    if (message && MESSAGES[message]) {
      toast.error(MESSAGES[message]);
      // Clean the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      router.replace(url.pathname, { scroll: false });
    }
  }, [message, router]);

  return null;
}
