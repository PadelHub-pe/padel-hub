"use client";

import Link from "next/link";

import { Button } from "@wifo/ui/button";
import { Separator } from "@wifo/ui/separator";
import { Sheet, SheetContent } from "@wifo/ui/sheet";

import { NAV_LINKS } from "~/lib/constants";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <div className="flex flex-col gap-6 pt-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
            onClick={() => onOpenChange(false)}
          >
            Padel<span className="text-secondary">Hub</span>
          </Link>

          <Separator />

          {/* Nav Links */}
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary text-base font-medium transition-colors"
                onClick={() => onOpenChange(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Separator />

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Button variant="secondary" asChild>
              <Link href="/canchas" onClick={() => onOpenChange(false)}>
                Buscar Canchas
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href="/para-propietarios"
                onClick={() => onOpenChange(false)}
              >
                Registrar Mi Local
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
