"use client";

import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@wifo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";

import type { AccessRequestRow } from "./access-requests-columns";
import { DataTable } from "~/components/ui/data-table";
import { useTRPC } from "~/trpc/react";
import { getAccessRequestColumns } from "./access-requests-columns";
import { ApproveDialog } from "./approve-dialog";
import { RejectDialog } from "./reject-dialog";

const STATUS_TABS = [
  { label: "Todas", value: undefined },
  { label: "Pendientes", value: "pending" as const },
  { label: "Aprobadas", value: "approved" as const },
  { label: "Rechazadas", value: "rejected" as const },
];

const TYPE_TABS = [
  { label: "Todos", value: undefined },
  { label: "Jugadores", value: "player" as const },
  { label: "Propietarios", value: "owner" as const },
];

export function AccessRequestsView() {
  const trpc = useTRPC();
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | undefined
  >(undefined);
  const [typeFilter, setTypeFilter] = useState<"player" | "owner" | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [approveTarget, setApproveTarget] = useState<AccessRequestRow | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<AccessRequestRow | null>(
    null,
  );

  const { data: stats } = useSuspenseQuery(trpc.admin.getStats.queryOptions());
  const { data: requestsData } = useSuspenseQuery(
    trpc.admin.listAccessRequests.queryOptions({
      status: statusFilter,
      type: typeFilter,
      search: search || undefined,
    }),
  );

  const columns = useMemo(
    () => getAccessRequestColumns(setApproveTarget, setRejectTarget),
    [],
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Solicitudes de Acceso</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Organizaciones" value={stats.totalOrganizations} />
        <StatCard title="Sedes" value={stats.totalFacilities} />
        <StatCard title="Usuarios" value={stats.totalUsers} />
        <StatCard
          title="Pendientes"
          value={stats.pendingRequests}
          highlight={stats.pendingRequests > 0}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 rounded-lg border bg-white p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border bg-white p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                typeFilter === tab.value
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Buscar por email, nombre o sede..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white"
        />
        <span className="text-muted-foreground ml-auto text-sm">
          {requestsData.total} resultado{requestsData.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={requestsData.items as AccessRequestRow[]}
      />

      {/* Dialogs */}
      <ApproveDialog
        request={approveTarget}
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      />
      <RejectDialog
        request={rejectTarget}
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn("text-2xl font-bold", highlight && "text-orange-600")}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
