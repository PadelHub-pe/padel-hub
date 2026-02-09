"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@wifo/ui/button";

import { NAV_LINKS } from "~/lib/constants";
import { Container } from "./container";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-xl font-bold tracking-tight">
            Padel<span className="text-secondary">Hub</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/para-propietarios">Registrar Mi Local</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/canchas">Buscar Canchas</Link>
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1 md:hidden">
          <Link
            href="/canchas"
            className="text-muted-foreground hover:text-primary inline-flex items-center justify-center rounded-lg p-2 transition-colors"
            aria-label="Buscar canchas"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </Link>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-lg p-2 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
      </Container>
    </header>
  );
}
