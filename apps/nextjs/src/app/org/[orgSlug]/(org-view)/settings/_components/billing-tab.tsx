"use client";

import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";

interface BillingTabProps {
  billingEnabled: boolean;
}

export function BillingTab({ billingEnabled }: BillingTabProps) {
  if (!billingEnabled) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-16">
        <CreditCardIcon className="mb-4 h-12 w-12 text-gray-300" />
        <Badge variant="secondary" className="mb-3">
          Próximamente
        </Badge>
        <h3 className="text-lg font-semibold text-gray-900">Facturación</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
          La gestión de facturación y planes estará disponible próximamente.
          Mientras tanto, disfruta de la beta gratuita.
        </p>
        <Button className="mt-6" disabled>
          Beta Gratuita
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Facturación</h2>
      <p className="mt-1 text-sm text-gray-500">
        Administra tu plan y método de pago
      </p>
    </div>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
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
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
      />
    </svg>
  );
}
