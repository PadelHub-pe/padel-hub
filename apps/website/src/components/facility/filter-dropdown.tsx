"use client";

import type { ReactNode } from "react";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@wifo/ui/popover";

interface FilterDropdownProps {
  label: string;
  /** Number of active selections — shows a count badge when > 0 */
  activeCount?: number;
  children: ReactNode;
  /** Called when the "Limpiar" button is clicked */
  onClear?: () => void;
  /** Show the footer with Limpiar button (default: true) */
  showFooter?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
}

export function FilterDropdown({
  label,
  activeCount = 0,
  children,
  onClear,
  showFooter = true,
  align = "start",
  className,
  contentClassName,
}: FilterDropdownProps) {
  const isActive = activeCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
            isActive
              ? "border-primary/30 bg-primary/5 text-primary"
              : "bg-background text-foreground hover:bg-muted",
            className,
          )}
        >
          <div className="flex items-center gap-1.5">
            <span>{label}</span>
            {isActive && (
              <span className="bg-primary text-primary-foreground inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold">
                {activeCount}
              </span>
            )}
          </div>
          {/* Chevron down */}
          <svg
            className="h-3.5 w-3.5 shrink-0 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn("w-64 p-0", contentClassName)}
      >
        <div className="max-h-72 overflow-y-auto p-2">{children}</div>
        {showFooter && onClear && isActive && (
          <div className="border-border flex items-center justify-between border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-auto px-2 py-1 text-xs"
              onClick={onClear}
            >
              Limpiar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
