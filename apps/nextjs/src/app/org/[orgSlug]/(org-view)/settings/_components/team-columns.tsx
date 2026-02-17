"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@wifo/ui/avatar";
import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wifo/ui/dropdown-menu";

export interface TeamMemberRow {
  id: string;
  type: "member" | "invite";
  name: string;
  email: string;
  image: string | null;
  role: "org_admin" | "facility_manager" | "staff";
  facilityIds: string[];
  facilityNames: string[];
  isCurrentUser: boolean;
  createdAt: Date;
}

const roleLabels: Record<string, string> = {
  org_admin: "Administrador",
  facility_manager: "Gerente",
  staff: "Staff",
};

const roleBadgeClasses: Record<string, string> = {
  org_admin: "bg-red-100 text-red-700 hover:bg-red-100",
  facility_manager: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  staff: "bg-gray-100 text-gray-700 hover:bg-gray-100",
};

interface TeamColumnsOptions {
  onEdit: (member: TeamMemberRow) => void;
  onRemove: (member: TeamMemberRow) => void;
  onResend: (member: TeamMemberRow) => void;
  onCancel: (member: TeamMemberRow) => void;
}

export function getTeamColumns(options: TeamColumnsOptions): ColumnDef<TeamMemberRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Miembro",
      cell: ({ row }) => {
        const m = row.original;
        const initials = m.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            {m.type === "invite" ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                <MailIcon className="h-4 w-4" />
              </div>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.image ?? undefined} />
                <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {m.type === "invite" ? m.email : m.name}
                </span>
                {m.isCurrentUser && (
                  <span className="text-xs text-blue-600">(Tú)</span>
                )}
              </div>
              {m.type === "member" && (
                <span className="text-xs text-gray-500">{m.email}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={roleBadgeClasses[row.original.role] ?? ""}
        >
          {roleLabels[row.original.role] ?? row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "facilityNames",
      header: "Locales",
      cell: ({ row }) => {
        const m = row.original;
        if (m.role === "org_admin") {
          return (
            <span className="text-sm text-gray-500">Todos los locales</span>
          );
        }
        if (m.facilityNames.length === 0) {
          return (
            <span className="text-sm text-gray-400">Sin asignar</span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {m.facilityNames.map((name) => (
              <Badge key={name} variant="outline" className="text-xs font-normal">
                {name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Estado",
      cell: ({ row }) => {
        const isPending = row.original.type === "invite";
        return (
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isPending ? "bg-amber-400" : "bg-green-500"}`}
            />
            <span className="text-sm text-gray-600">
              {isPending ? "Pendiente" : "Activo"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const m = row.original;
        if (m.isCurrentUser) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <DotsIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {m.type === "member" ? (
                <>
                  <DropdownMenuItem onClick={() => options.onEdit(m)}>
                    Editar rol
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => options.onRemove(m)}
                  >
                    Eliminar
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => options.onResend(m)}>
                    Reenviar invitación
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => options.onCancel(m)}
                  >
                    Cancelar invitación
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

function MailIcon({ className }: { className?: string }) {
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
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function DotsIcon({ className }: { className?: string }) {
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
        d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
      />
    </svg>
  );
}
