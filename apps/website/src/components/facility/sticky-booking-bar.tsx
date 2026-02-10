"use client";

import { Button } from "@wifo/ui/button";

interface StickyBookingBarProps {
  facilityName: string;
  priceLabel: string | null;
  phone: string | null;
  whatsappPhone?: string | null;
  bookingUrl?: string | null;
}

export function StickyBookingBar({
  facilityName,
  priceLabel,
  phone,
  whatsappPhone,
  bookingUrl,
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
          {bookingUrl ? (
            <Button variant="secondary" size="sm" asChild>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Reservar
              </a>
            </Button>
          ) : whatsappPhone ? (
            <Button variant="secondary" size="sm" asChild>
              <a
                href={`https://wa.me/${whatsappPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
