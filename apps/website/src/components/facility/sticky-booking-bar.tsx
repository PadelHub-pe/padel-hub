"use client";

import { Button } from "@wifo/ui/button";

import { APP_STORE_URL } from "~/lib/constants";

interface StickyBookingBarProps {
  facilityName: string;
  priceLabel: string | null;
  phone: string | null;
}

export function StickyBookingBar({
  facilityName,
  priceLabel,
  phone,
}: StickyBookingBarProps) {
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{facilityName}</p>
          {priceLabel && (
            <p className="text-secondary text-xs font-bold">{priceLabel}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 gap-2">
          {phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${phone}`}>Llamar</a>
            </Button>
          )}
          <Button variant="secondary" size="sm" asChild>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Reservar
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
