import Link from "next/link";

import { BreadcrumbSchema } from "./structured-data";

interface BreadcrumbItem {
  name: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ name: "Inicio", href: "/" }, ...items];

  return (
    <>
      <BreadcrumbSchema items={allItems} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
          {allItems.map((item, index) => (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 && (
                <svg
                  className="h-3 w-3 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              )}
              {index === allItems.length - 1 ? (
                <span className="text-foreground font-medium">{item.name}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
