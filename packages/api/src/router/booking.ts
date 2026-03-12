import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay } from "date-fns";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  ne,
  or,
} from "drizzle-orm";
import { z } from "zod/v4";

import {
  blockedSlots,
  bookingActivity,
  bookingPlayers,
  bookings,
  courts,
  CreateManualBookingSchema,
  facilities,
  operatingHours,
  peakPeriods,
  user,
} from "@wifo/db/schema";

import type {
  ScheduleConfig,
  SlotCourtPricing,
  SlotFacilityDefaults,
} from "../utils/schedule";
import { verifyFacilityAccess } from "../lib/access-control";
import { logBookingActivity } from "../lib/booking-activity";
import { protectedProcedure } from "../trpc";
import {
  getRateForSlot,
  getTimeZoneWithMarkup,
  parseTimeToMinutes,
} from "../utils/schedule";

// =============================================================================
// Input Schemas
// =============================================================================

const bookingStatusValues = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "open_match",
] as const;

const listBookingsSchema = z.object({
  facilityId: z.string().uuid(),
  search: z.string().optional(),
  courtId: z.string().uuid().optional(),
  status: z.array(z.enum(bookingStatusValues)).optional(),
  date: z.date().optional(),
  dateRange: z.object({ start: z.date(), end: z.date() }).optional(),
  sortBy: z.enum(["date", "time", "court", "price", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

const getByIdSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
});

const confirmSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
});

const cancelBookingSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
  status: z.enum(bookingStatusValues),
});

const createManualSchema = CreateManualBookingSchema.extend({
  facilityId: z.string().uuid(),
});

const getStatsSchema = z.object({
  facilityId: z.string().uuid(),
});

const addPlayerSchema = z.object({
  facilityId: z.string().uuid(),
  bookingId: z.string().uuid(),
  position: z.number().int().min(1).max(4),
  userId: z.string().optional(),
  guestName: z.string().max(100).optional(),
  guestEmail: z.string().email().optional().or(z.literal("")),
  guestPhone: z.string().max(20).optional(),
});

const removePlayerSchema = z.object({
  facilityId: z.string().uuid(),
  bookingId: z.string().uuid(),
  playerId: z.string().uuid(),
});

const getActivitySchema = z.object({
  facilityId: z.string().uuid(),
  bookingId: z.string().uuid(),
});

const searchUsersSchema = z.object({
  facilityId: z.string().uuid(),
  bookingId: z.string().uuid(),
  query: z.string().min(1).max(100),
});

const getSlotInfoSchema = z.object({
  facilityId: z.string().uuid(),
  date: z.date(),
});

const calculatePriceSchema = z.object({
  facilityId: z.string().uuid(),
  courtId: z.string().uuid(),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a unique booking code in format PH-YYYY-XXXX
 */
function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PH-${year}-${random}`;
}

/**
 * Calculate price for a booking time range using schedule zone logic.
 * Iterates over 30-min slots and sums rates.
 */
function calculateBookingPrice(
  startTime: string,
  endTime: string,
  dayOfWeek: number,
  dateStr: string,
  config: ScheduleConfig,
  courtPricing: SlotCourtPricing,
  facilityDefaults: SlotFacilityDefaults | null,
): {
  priceInCents: number;
  isPeakRate: boolean;
  slots: { time: string; zone: string; rateInCents: number }[];
} {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  let totalPrice = 0;
  let hasPeak = false;
  const slots: { time: string; zone: string; rateInCents: number }[] = [];

  for (let min = startMinutes; min < endMinutes; min += 30) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const slotTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

    const { zone } = getTimeZoneWithMarkup(
      slotTime,
      dayOfWeek,
      dateStr,
      config,
    );
    const rate = getRateForSlot(courtPricing, zone, facilityDefaults);

    if (zone === "peak") hasPeak = true;
    totalPrice += rate;
    slots.push({ time: slotTime, zone, rateInCents: rate });
  }

  return { priceInCents: totalPrice, isPeakRate: hasPeak, slots };
}

// =============================================================================
// Router
// =============================================================================

export const bookingRouter = {
  /**
   * List all bookings for a facility with pagination and filters
   */
  list: protectedProcedure
    .input(listBookingsSchema)
    .query(async ({ ctx, input }) => {
      const {
        facilityId,
        search,
        courtId,
        status,
        date,
        dateRange,
        sortBy,
        sortOrder,
        page,
        limit,
      } = input;
      const offset = (page - 1) * limit;

      // Verify access with booking:read permission
      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      // Build where conditions
      const conditions = [eq(bookings.facilityId, facilityId)];

      if (courtId) {
        conditions.push(eq(bookings.courtId, courtId));
      }

      // Multi-status filter: use inArray when array has items
      if (status && status.length > 0) {
        conditions.push(inArray(bookings.status, status));
      }

      // Date range filter takes precedence over single date
      if (dateRange) {
        const rangeStart = startOfDay(dateRange.start);
        const rangeEnd = startOfDay(addDays(dateRange.end, 1));
        conditions.push(gte(bookings.date, rangeStart));
        conditions.push(lt(bookings.date, rangeEnd));
      } else if (date) {
        const dayStart = startOfDay(date);
        const dayEnd = startOfDay(addDays(date, 1));
        conditions.push(gte(bookings.date, dayStart));
        conditions.push(lt(bookings.date, dayEnd));
      }

      if (search) {
        const searchPattern = `%${search}%`;
        const searchCondition = or(
          ilike(bookings.code, searchPattern),
          ilike(bookings.customerName, searchPattern),
          ilike(bookings.customerEmail, searchPattern),
          ilike(bookings.customerPhone, searchPattern),
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const whereClause = and(...conditions);

      // Get total count
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(bookings)
        .where(whereClause);
      const total = totalResult?.count ?? 0;

      // Build dynamic order by
      const direction = sortOrder === "asc" ? asc : desc;
      const sortColumnMap = {
        date: bookings.date,
        time: bookings.startTime,
        court: bookings.courtId,
        price: bookings.priceInCents,
        status: bookings.status,
      };

      const orderBy = sortBy
        ? [direction(sortColumnMap[sortBy]), desc(bookings.createdAt)]
        : [desc(bookings.date), desc(bookings.createdAt)];

      // Get bookings with court info and players
      const bookingsList = await ctx.db.query.bookings.findMany({
        where: whereClause,
        with: {
          court: true,
          user: true,
          players: true,
        },
        orderBy,
        limit,
        offset,
      });

      return {
        bookings: bookingsList.map((b) => ({
          ...b,
          playerCount: b.players.length,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * Get a single booking by ID with players and activity
   */
  getById: protectedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, id } = input;

      // Verify access with booking:read permission
      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, id), eq(bookings.facilityId, facilityId)),
        with: {
          court: true,
          user: true,
          players: {
            with: {
              user: true,
            },
          },
          activity: {
            with: {
              performer: true,
            },
            orderBy: [desc(bookingActivity.createdAt)],
          },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reserva no encontrada",
        });
      }

      return {
        ...booking,
        playerCount: booking.players.length,
      };
    }),

  /**
   * Confirm a pending booking
   */
  confirm: protectedProcedure
    .input(confirmSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, id } = input;

      // Verify access with booking:manage permission
      await verifyFacilityAccess(ctx, facilityId, "booking:manage");

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, id), eq(bookings.facilityId, facilityId)),
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reserva no encontrada",
        });
      }

      if (booking.status !== "pending" && booking.status !== "open_match") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Solo se pueden confirmar reservas pendientes o partidos abiertos",
        });
      }

      const [updatedBooking] = await ctx.db
        .update(bookings)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
        })
        .where(eq(bookings.id, id))
        .returning();

      await logBookingActivity({
        db: ctx.db,
        bookingId: id,
        type: "confirmed",
        description: "Reserva confirmada",
        performedBy: ctx.session.user.id,
      });

      return updatedBooking;
    }),

  /**
   * Cancel a booking
   */
  cancel: protectedProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, id, reason } = input;

      // Verify access with booking:manage permission
      await verifyFacilityAccess(ctx, facilityId, "booking:manage");

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, id), eq(bookings.facilityId, facilityId)),
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reserva no encontrada",
        });
      }

      if (booking.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La reserva ya está cancelada",
        });
      }

      if (booking.status === "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No se puede cancelar una reserva completada",
        });
      }

      const [updatedBooking] = await ctx.db
        .update(bookings)
        .set({
          status: "cancelled",
          cancelledBy: "owner",
          cancellationReason: reason ?? null,
          cancelledAt: new Date(),
        })
        .where(eq(bookings.id, id))
        .returning();

      await logBookingActivity({
        db: ctx.db,
        bookingId: id,
        type: "cancelled",
        description: reason
          ? `Reserva cancelada: ${reason}`
          : "Reserva cancelada",
        performedBy: ctx.session.user.id,
      });

      return updatedBooking;
    }),

  /**
   * Update booking status
   */
  updateStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, id, status } = input;

      // Verify access with booking:manage permission
      await verifyFacilityAccess(ctx, facilityId, "booking:manage");

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, id), eq(bookings.facilityId, facilityId)),
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reserva no encontrada",
        });
      }

      const updateData: Record<string, unknown> = { status };

      if (status === "confirmed" && !booking.confirmedAt) {
        updateData.confirmedAt = new Date();
      }

      if (status === "cancelled") {
        updateData.cancelledBy = "owner";
        updateData.cancelledAt = new Date();
      }

      const [updatedBooking] = await ctx.db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, id))
        .returning();

      await logBookingActivity({
        db: ctx.db,
        bookingId: id,
        type: "status_changed",
        description: `Estado cambiado a ${status}`,
        metadata: { oldStatus: booking.status, newStatus: status },
        performedBy: ctx.session.user.id,
      });

      return updatedBooking;
    }),

  /**
   * Create a manual booking (walk-in)
   */
  createManual: protectedProcedure
    .input(createManualSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId } = input;

      // Verify access with booking:write permission
      await verifyFacilityAccess(ctx, facilityId, "booking:write");

      // Verify court belongs to facility
      const court = await ctx.db.query.courts.findFirst({
        where: and(
          eq(courts.id, input.courtId),
          eq(courts.facilityId, facilityId),
        ),
      });

      if (!court) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cancha no encontrada",
        });
      }

      // Check for overlapping active bookings on same court + date + time range
      const dayStart = startOfDay(input.date);
      const dayEnd = startOfDay(addDays(input.date, 1));
      const overlapping = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.courtId, input.courtId),
          gte(bookings.date, dayStart),
          lt(bookings.date, dayEnd),
          ne(bookings.status, "cancelled"),
          lt(bookings.startTime, input.endTime),
          gt(bookings.endTime, input.startTime),
        ),
      });

      if (overlapping) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `La cancha ya tiene una reserva de ${overlapping.startTime.slice(0, 5)} a ${overlapping.endTime.slice(0, 5)}`,
        });
      }

      // --- Server-side price calculation ---
      const dayOfWeek = input.date.getDay();
      const dateStr = `${input.date.getFullYear()}-${(input.date.getMonth() + 1).toString().padStart(2, "0")}-${input.date.getDate().toString().padStart(2, "0")}`;

      const [hoursList, periodsList, blockedSlotsList, facility] =
        await Promise.all([
          ctx.db.query.operatingHours.findMany({
            where: eq(operatingHours.facilityId, facilityId),
          }),
          ctx.db.query.peakPeriods.findMany({
            where: and(
              eq(peakPeriods.facilityId, facilityId),
              eq(peakPeriods.isActive, true),
            ),
          }),
          ctx.db.query.blockedSlots.findMany({
            where: and(
              eq(blockedSlots.facilityId, facilityId),
              gte(blockedSlots.date, dayStart),
              lt(blockedSlots.date, dayEnd),
            ),
          }),
          ctx.db.query.facilities.findFirst({
            where: eq(facilities.id, facilityId),
            columns: {
              defaultPriceInCents: true,
              defaultPeakPriceInCents: true,
            },
          }),
        ]);

      const scheduleConfig: ScheduleConfig = {
        operatingHours: hoursList.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime.slice(0, 5),
          closeTime: h.closeTime.slice(0, 5),
          isClosed: h.isClosed,
        })),
        peakPeriods: periodsList.map((p) => ({
          daysOfWeek: p.daysOfWeek,
          startTime: p.startTime.slice(0, 5),
          endTime: p.endTime.slice(0, 5),
          markupPercent: p.markupPercent,
        })),
        blockedSlots: blockedSlotsList.map((b) => ({
          date: dateStr,
          startTime: b.startTime.slice(0, 5),
          endTime: b.endTime.slice(0, 5),
          courtId: b.courtId,
        })),
      };

      const courtPricing: SlotCourtPricing = {
        priceInCents: court.priceInCents,
        peakPriceInCents: court.peakPriceInCents,
      };

      const facilityDefaults: SlotFacilityDefaults | null = facility
        ? {
            defaultPriceInCents: facility.defaultPriceInCents,
            defaultPeakPriceInCents: facility.defaultPeakPriceInCents,
          }
        : null;

      const { priceInCents, isPeakRate } = calculateBookingPrice(
        input.startTime,
        input.endTime,
        dayOfWeek,
        dateStr,
        scheduleConfig,
        courtPricing,
        facilityDefaults,
      );

      // Generate unique booking code
      let code = generateBookingCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await ctx.db.query.bookings.findFirst({
          where: eq(bookings.code, code),
        });
        if (!existing) break;
        code = generateBookingCode();
        attempts++;
      }

      const [booking] = await ctx.db
        .insert(bookings)
        .values({
          code,
          courtId: input.courtId,
          facilityId,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          priceInCents,
          isPeakRate,
          paymentMethod: input.paymentMethod ?? null,
          customerName: input.customerName,
          customerPhone: input.customerPhone ?? null,
          customerEmail: input.customerEmail ?? null,
          notes: input.notes ?? null,
          isManualBooking: true,
          status: "confirmed",
          confirmedAt: new Date(),
        })
        .returning();

      if (booking) {
        // Add customer as owner player at position 1 (guest, since manual bookings are walk-ins)
        await ctx.db.insert(bookingPlayers).values({
          bookingId: booking.id,
          role: "owner",
          position: 1,
          guestName: input.customerName,
          guestEmail: input.customerEmail ?? null,
          guestPhone: input.customerPhone ?? null,
        });

        // Add additional players if provided (positions 2-4)
        if (input.players?.length) {
          await ctx.db.insert(bookingPlayers).values(
            input.players.map((p) => ({
              bookingId: booking.id,
              role: "player" as const,
              position: p.position,
              guestName: p.guestName,
            })),
          );
        }

        await logBookingActivity({
          db: ctx.db,
          bookingId: booking.id,
          type: "created",
          description: `Reserva manual creada para ${input.customerName}`,
          performedBy: ctx.session.user.id,
        });
      }

      return booking;
    }),

  /**
   * Get booking stats for dashboard
   */
  getStats: protectedProcedure
    .input(getStatsSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      // Verify access with booking:read permission
      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      // Get today's date range
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);

      // Today's bookings count
      const [todayResult] = await ctx.db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, today),
            lt(bookings.date, tomorrow),
          ),
        );

      // Pending bookings count
      const [pendingResult] = await ctx.db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            eq(bookings.status, "pending"),
          ),
        );

      // Total bookings
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(bookings)
        .where(eq(bookings.facilityId, facilityId));

      return {
        todayBookings: todayResult?.count ?? 0,
        pendingBookings: pendingResult?.count ?? 0,
        totalBookings: totalResult?.count ?? 0,
      };
    }),

  /**
   * Add a player to a booking
   */
  addPlayer: protectedProcedure
    .input(addPlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        facilityId,
        bookingId,
        position,
        userId,
        guestName,
        guestEmail,
        guestPhone,
      } = input;

      await verifyFacilityAccess(ctx, facilityId, "booking:manage");

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.facilityId, facilityId),
        ),
        with: { players: true },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reserva no encontrada",
        });
      }

      // Check max 4 players
      if (booking.players.length >= 4) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La reserva ya tiene 4 jugadores",
        });
      }

      // Check position available
      if (booking.players.some((p) => p.position === position)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La posición ya está ocupada",
        });
      }

      // Check user not duplicate
      if (userId && booking.players.some((p) => p.userId === userId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El jugador ya está en la reserva",
        });
      }

      const [player] = await ctx.db
        .insert(bookingPlayers)
        .values({
          bookingId,
          userId: userId ?? null,
          role: "player",
          position,
          guestName: guestName ?? null,
          guestEmail: guestEmail ?? null,
          guestPhone: guestPhone ?? null,
        })
        .returning();

      // Determine player name for activity log
      let playerName = guestName ?? "Jugador";
      if (userId) {
        const playerUser = await ctx.db.query.user.findFirst({
          where: eq(user.id, userId),
        });
        if (playerUser?.name) playerName = playerUser.name;
      }

      await logBookingActivity({
        db: ctx.db,
        bookingId,
        type: "player_joined",
        description: `${playerName} se unió en posición ${position}`,
        metadata: { position, userId, guestName },
        performedBy: ctx.session.user.id,
      });

      // Auto-confirm if full (4/4) and was open_match
      const newPlayerCount = booking.players.length + 1;
      if (newPlayerCount >= 4 && booking.status === "open_match") {
        await ctx.db
          .update(bookings)
          .set({ status: "confirmed", confirmedAt: new Date() })
          .where(eq(bookings.id, bookingId));

        await logBookingActivity({
          db: ctx.db,
          bookingId,
          type: "confirmed",
          description: "Partido completo (4/4) - confirmado automáticamente",
          performedBy: ctx.session.user.id,
        });
      }

      return player;
    }),

  /**
   * Remove a non-owner player from a booking
   */
  removePlayer: protectedProcedure
    .input(removePlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, bookingId, playerId } = input;

      await verifyFacilityAccess(ctx, facilityId, "booking:manage");

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.facilityId, facilityId),
        ),
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reserva no encontrada",
        });
      }

      const player = await ctx.db.query.bookingPlayers.findFirst({
        where: and(
          eq(bookingPlayers.id, playerId),
          eq(bookingPlayers.bookingId, bookingId),
        ),
        with: { user: true },
      });

      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Jugador no encontrado",
        });
      }

      if (player.role === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No se puede remover al creador de la reserva",
        });
      }

      await ctx.db
        .delete(bookingPlayers)
        .where(eq(bookingPlayers.id, playerId));

      const playerName = player.user?.name ?? player.guestName ?? "Jugador";

      await logBookingActivity({
        db: ctx.db,
        bookingId,
        type: "player_left",
        description: `${playerName} fue removido de la posición ${player.position}`,
        metadata: { position: player.position, playerName },
        performedBy: ctx.session.user.id,
      });

      return { success: true };
    }),

  /**
   * Get activity log for a booking
   */
  getActivity: protectedProcedure
    .input(getActivitySchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, bookingId } = input;

      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      const activities = await ctx.db.query.bookingActivity.findMany({
        where: eq(bookingActivity.bookingId, bookingId),
        with: { performer: true },
        orderBy: [desc(bookingActivity.createdAt)],
      });

      return activities;
    }),

  /**
   * Search users for add-player modal
   */
  searchUsers: protectedProcedure
    .input(searchUsersSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, bookingId, query } = input;

      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      // Get current players to exclude
      const currentPlayers = await ctx.db.query.bookingPlayers.findMany({
        where: eq(bookingPlayers.bookingId, bookingId),
        columns: { userId: true },
      });

      const excludeIds = currentPlayers
        .map((p) => p.userId)
        .filter((id): id is string => id !== null);

      const searchPattern = `%${query}%`;
      const searchCondition = or(
        ilike(user.name, searchPattern),
        ilike(user.email, searchPattern),
      );

      let whereClause = searchCondition;
      if (excludeIds.length > 0) {
        const excludeConditions = excludeIds.map((id) => ne(user.id, id));
        whereClause = and(searchCondition, ...excludeConditions);
      }

      const users = await ctx.db.query.user.findMany({
        where: whereClause,
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        limit: 10,
      });

      return users;
    }),

  /**
   * Get slot info for create booking dialog (operating hours, peak periods, existing bookings, blocked slots)
   */
  getSlotInfo: protectedProcedure
    .input(getSlotInfoSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, date } = input;

      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(addDays(date, 1));
      const dayOfWeek = date.getDay(); // 0 = Sunday

      const [
        operatingHoursList,
        peakPeriodsList,
        bookingsList,
        blockedSlotsList,
      ] = await Promise.all([
        ctx.db.query.operatingHours.findMany({
          where: eq(operatingHours.facilityId, facilityId),
        }),
        ctx.db.query.peakPeriods.findMany({
          where: and(
            eq(peakPeriods.facilityId, facilityId),
            eq(peakPeriods.isActive, true),
          ),
        }),
        ctx.db.query.bookings.findMany({
          where: and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, dayStart),
            lt(bookings.date, dayEnd),
            ne(bookings.status, "cancelled"),
          ),
          columns: {
            id: true,
            courtId: true,
            startTime: true,
            endTime: true,
            status: true,
            customerName: true,
          },
          orderBy: [asc(bookings.startTime)],
        }),
        ctx.db.query.blockedSlots.findMany({
          where: and(
            eq(blockedSlots.facilityId, facilityId),
            gte(blockedSlots.date, dayStart),
            lt(blockedSlots.date, dayEnd),
          ),
          columns: {
            courtId: true,
            startTime: true,
            endTime: true,
            reason: true,
          },
        }),
      ]);

      // Find operating hours for this day of week
      const dayHours = operatingHoursList.find(
        (h) => h.dayOfWeek === dayOfWeek,
      );
      const opHours = dayHours
        ? {
            openTime: dayHours.openTime,
            closeTime: dayHours.closeTime,
            isClosed: dayHours.isClosed,
          }
        : { openTime: "08:00:00", closeTime: "22:00:00", isClosed: false };

      // Filter peak periods that apply to this day of week
      const dayPeakPeriods = peakPeriodsList
        .filter((p) => p.daysOfWeek.includes(dayOfWeek))
        .map((p) => ({
          startTime: p.startTime,
          endTime: p.endTime,
          markupPercent: p.markupPercent,
        }));

      return {
        operatingHours: opHours,
        peakPeriods: dayPeakPeriods,
        existingBookings: bookingsList.map((b) => ({
          id: b.id,
          courtId: b.courtId,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          customerName: b.customerName,
        })),
        blockedSlots: blockedSlotsList.map((b) => ({
          courtId: b.courtId,
          startTime: b.startTime,
          endTime: b.endTime,
          reason: b.reason,
        })),
      };
    }),

  /**
   * Calculate price for a court+date+time selection (preview for create dialog)
   */
  calculatePrice: protectedProcedure
    .input(calculatePriceSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, courtId, date, startTime, endTime } = input;

      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      const court = await ctx.db.query.courts.findFirst({
        where: and(eq(courts.id, courtId), eq(courts.facilityId, facilityId)),
      });

      if (!court) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cancha no encontrada",
        });
      }

      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(addDays(date, 1));
      const dayOfWeek = date.getDay();
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

      const [hoursList, periodsList, blockedSlotsList, facility] =
        await Promise.all([
          ctx.db.query.operatingHours.findMany({
            where: eq(operatingHours.facilityId, facilityId),
          }),
          ctx.db.query.peakPeriods.findMany({
            where: and(
              eq(peakPeriods.facilityId, facilityId),
              eq(peakPeriods.isActive, true),
            ),
          }),
          ctx.db.query.blockedSlots.findMany({
            where: and(
              eq(blockedSlots.facilityId, facilityId),
              gte(blockedSlots.date, dayStart),
              lt(blockedSlots.date, dayEnd),
            ),
          }),
          ctx.db.query.facilities.findFirst({
            where: eq(facilities.id, facilityId),
            columns: {
              defaultPriceInCents: true,
              defaultPeakPriceInCents: true,
            },
          }),
        ]);

      const scheduleConfig: ScheduleConfig = {
        operatingHours: hoursList.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime.slice(0, 5),
          closeTime: h.closeTime.slice(0, 5),
          isClosed: h.isClosed,
        })),
        peakPeriods: periodsList.map((p) => ({
          daysOfWeek: p.daysOfWeek,
          startTime: p.startTime.slice(0, 5),
          endTime: p.endTime.slice(0, 5),
          markupPercent: p.markupPercent,
        })),
        blockedSlots: blockedSlotsList.map((b) => ({
          date: dateStr,
          startTime: b.startTime.slice(0, 5),
          endTime: b.endTime.slice(0, 5),
          courtId: b.courtId,
        })),
      };

      const courtPricing: SlotCourtPricing = {
        priceInCents: court.priceInCents,
        peakPriceInCents: court.peakPriceInCents,
      };

      const facilityDefaults: SlotFacilityDefaults | null = facility
        ? {
            defaultPriceInCents: facility.defaultPriceInCents,
            defaultPeakPriceInCents: facility.defaultPeakPriceInCents,
          }
        : null;

      return calculateBookingPrice(
        startTime,
        endTime,
        dayOfWeek,
        dateStr,
        scheduleConfig,
        courtPricing,
        facilityDefaults,
      );
    }),
} satisfies TRPCRouterRecord;
