import { cn } from "@wifo/ui";

import { Container } from "./container";

interface SectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  /** Set false to skip the default Container wrapper. @default true */
  container?: boolean;
}

export function Section({
  id,
  children,
  className,
  container = true,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "bg-muted/30 border-y border-gray-200 py-12 sm:py-16",
        className,
      )}
    >
      {container ? <Container>{children}</Container> : children}
    </section>
  );
}
