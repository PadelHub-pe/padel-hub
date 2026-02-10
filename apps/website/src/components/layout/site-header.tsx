"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";

import { NAV_LINKS } from "~/lib/constants";
import { Container } from "./container";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);
  // Skip transition on first render so the bar appears instantly
  const [animate, setAnimate] = useState(false);

  const activeIndex = NAV_LINKS.findIndex((link) =>
    pathname.startsWith(link.href),
  );

  const measureIndicator = useCallback(():
    | { left: number; width: number }
    | null => {
    const activeLink = NAV_LINKS[activeIndex];
    if (!activeLink || !navRef.current) return null;
    const el = linkRefs.current.get(activeLink.href);
    if (!el) return null;
    const navRect = navRef.current.getBoundingClientRect();
    const linkRect = el.getBoundingClientRect();
    return {
      left: linkRect.left - navRect.left,
      width: linkRect.width,
    };
  }, [activeIndex]);

  // Set position on mount (no transition), then enable transitions
  useEffect(() => {
    const pos = measureIndicator();
    setIndicator(pos);
    // Enable transitions after first paint
    requestAnimationFrame(() => {
      setAnimate(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate on route change (after mount)
  useEffect(() => {
    if (!animate) return;
    const pos = measureIndicator();
    setIndicator(pos);
  }, [measureIndicator, animate]);

  // Recalc on resize
  useEffect(() => {
    const onResize = () => setIndicator(measureIndicator());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureIndicator]);

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
        <nav
          ref={navRef}
          className="relative hidden items-center gap-8 md:flex"
        >
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => {
                if (el) linkRefs.current.set(link.href, el);
              }}
              className={cn(
                "text-sm font-medium transition-colors",
                i === activeIndex
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
          {/* Animated underbar */}
          {indicator && (
            <span
              className={cn(
                "bg-primary pointer-events-none absolute -bottom-[0.45rem] h-0.5 rounded-full",
                animate && "transition-all duration-300 ease-in-out",
              )}
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}
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
