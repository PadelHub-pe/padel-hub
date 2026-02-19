"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@wifo/ui/badge";

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  isActive: boolean;
  createdAt: Date;
  memberCount: number;
  facilityCount: number;
}

export function getOrganizationColumns(): ColumnDef<OrganizationRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
          {row.original.slug}
        </code>
      ),
    },
    {
      accessorKey: "contactEmail",
      header: "Email",
      cell: ({ row }) => row.original.contactEmail ?? "-",
    },
    {
      accessorKey: "memberCount",
      header: "Miembros",
    },
    {
      accessorKey: "facilityCount",
      header: "Sedes",
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Activa" : "Inactiva"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Creación",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
  ];
}
