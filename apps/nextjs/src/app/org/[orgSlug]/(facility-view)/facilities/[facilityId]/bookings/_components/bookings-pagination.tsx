"use client";

import { Button } from "@wifo/ui/button";

interface BookingsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function BookingsPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: BookingsPaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Mostrando {start}-{end} de {total} reservas
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
