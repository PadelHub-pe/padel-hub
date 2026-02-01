import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure } from "../trpc";

// Mock data for MVP - will be replaced with real database queries
const mockStats = {
  todayBookings: {
    value: 12,
    change: 8.2,
    label: "Reservas Hoy",
  },
  todayRevenue: {
    value: 1840,
    change: 12.5,
    label: "Ingresos Hoy",
  },
  occupancyRate: {
    value: 78,
    change: 4.1,
    label: "Ocupación",
  },
  monthlyRevenue: {
    value: 24650,
    change: -2.3,
    label: "Ingresos Mensual",
  },
};

const mockSchedule = [
  {
    id: "1",
    time: "09:00 - 10:30",
    court: "Cancha 1",
    customer: {
      name: "Carlos Mendoza",
      email: "carlos@email.com",
    },
    amount: 120,
    status: "confirmed" as const,
  },
  {
    id: "2",
    time: "10:30 - 12:00",
    court: "Cancha 2",
    customer: {
      name: "María García",
      email: "maria@email.com",
    },
    amount: 120,
    status: "confirmed" as const,
  },
  {
    id: "3",
    time: "14:00 - 15:30",
    court: "Cancha 1",
    customer: {
      name: "Juan Pérez",
      email: "juan@email.com",
    },
    amount: 150,
    status: "starting_soon" as const,
  },
  {
    id: "4",
    time: "15:30 - 17:00",
    court: "Cancha 3",
    customer: {
      name: "Ana López",
      email: "ana@email.com",
    },
    amount: 150,
    status: "confirmed" as const,
  },
  {
    id: "5",
    time: "18:00 - 19:30",
    court: "Cancha 2",
    customer: {
      name: "Roberto Silva",
      email: "roberto@email.com",
    },
    amount: 180,
    status: "confirmed" as const,
  },
];

export const dashboardRouter = {
  getStats: protectedProcedure.query(() => {
    return mockStats;
  }),

  getTodaySchedule: protectedProcedure.query(() => {
    return mockSchedule;
  }),
} satisfies TRPCRouterRecord;
