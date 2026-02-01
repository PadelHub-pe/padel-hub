"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@wifo/ui/avatar";
import { Badge } from "@wifo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wifo/ui/table";

import { useTRPC } from "~/trpc/react";

const statusConfig = {
  confirmed: {
    label: "Confirmado",
    variant: "success" as const,
  },
  starting_soon: {
    label: "Por iniciar",
    variant: "warning" as const,
  },
  pending: {
    label: "Pendiente",
    variant: "secondary" as const,
  },
  cancelled: {
    label: "Cancelado",
    variant: "destructive" as const,
  },
};

export function ScheduleTable() {
  const trpc = useTRPC();
  const { data: schedule } = useSuspenseQuery(
    trpc.dashboard.getTodaySchedule.queryOptions(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas de Hoy</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Cancha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((booking) => {
              const status = statusConfig[booking.status];
              const initials = booking.customer.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.time}</TableCell>
                  <TableCell>{booking.court}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.customer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.customer.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    S/ {booking.amount.toLocaleString("es-PE")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
