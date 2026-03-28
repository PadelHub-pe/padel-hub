"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@wifo/ui/badge";

export interface AccessRequestRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  type: "player" | "owner";
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  reviewerName: string | null;
  notes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  player: "Jugador",
  owner: "Propietario",
};

const TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  player: "secondary",
  owner: "default",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

export function getAccessRequestColumns(
  onApprove: (row: AccessRequestRow) => void,
  onReject: (row: AccessRequestRow) => void,
): ColumnDef<AccessRequestRow>[] {
  return [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Contacto",
      cell: ({ row }) => row.original.name ?? "-",
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant={TYPE_VARIANT[row.original.type]}>
          {TYPE_LABELS[row.original.type]}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        if (row.original.status !== "pending" || row.original.type === "player")
          return null;
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove(row.original);
              }}
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              Aprobar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(row.original);
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Rechazar
            </button>
          </div>
        );
      },
    },
  ];
}
