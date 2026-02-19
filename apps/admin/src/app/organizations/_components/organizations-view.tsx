"use client";

import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@wifo/ui/input";

import type { OrganizationRow } from "./organizations-columns";
import { DataTable } from "~/components/ui/data-table";
import { useTRPC } from "~/trpc/react";
import { getOrganizationColumns } from "./organizations-columns";

export function OrganizationsView() {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");

  const { data } = useSuspenseQuery(
    trpc.admin.listOrganizations.queryOptions({
      search: search || undefined,
    }),
  );

  const columns = useMemo(() => getOrganizationColumns(), []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Organizaciones</h1>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nombre, slug o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white"
        />
        <span className="text-muted-foreground ml-auto text-sm">
          {data.total} organización{data.total !== 1 ? "es" : ""}
        </span>
      </div>

      <DataTable columns={columns} data={data.items as OrganizationRow[]} />
    </div>
  );
}
