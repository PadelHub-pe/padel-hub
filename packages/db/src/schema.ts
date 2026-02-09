import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// =============================================================================
// Owner & Facility Schema
// =============================================================================

/**
 * Owner Accounts - linked to Better Auth user
 * Represents a court owner who manages one or more facilities
 */
export const ownerAccounts = pgTable("owner_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const ownerAccountsRelations = relations(ownerAccounts, ({ one, many }) => ({
  user: one(user, {
    fields: [ownerAccounts.userId],
    references: [user.id],
  }),
  facilities: many(facilities),
}));

/**
 * Facilities table - represents a padel venue/club
 */
export const facilities = pgTable("facilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => ownerAccounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 250 }).notNull().unique(),
  description: text("description"),
  address: varchar("address", { length: 500 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull().default("Lima"),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  photos: jsonb("photos").$type<string[]>().default([]),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const facilitiesRelations = relations(facilities, ({ one, many }) => ({
  owner: one(ownerAccounts, {
    fields: [facilities.ownerId],
    references: [ownerAccounts.id],
  }),
  courts: many(courts),
  operatingHours: many(operatingHours),
  timeSlotTemplates: many(timeSlotTemplates),
  bookings: many(bookings),
}));

/**
 * Court type enum
 */
export const courtTypeEnum = pgEnum("court_type", ["indoor", "outdoor"]);

/**
 * Booking status enum
 */
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

/**
 * Cancelled by enum
 */
export const cancelledByEnum = pgEnum("cancelled_by", ["user", "owner", "system"]);

/**
 * Payment method enum
 */
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "app"]);

/**
 * Court status enum
 */
export const courtStatusEnum = pgEnum("court_status", [
  "active",
  "maintenance",
  "inactive",
]);

/**
 * Courts table - individual padel courts within a facility
 */
export const courts = pgTable("courts", {
  id: uuid("id").primaryKey().defaultRandom(),
  facilityId: uuid("facility_id")
    .notNull()
    .references(() => facilities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: courtTypeEnum("type").notNull(),
  status: courtStatusEnum("status").default("active").notNull(),
  description: text("description"),
  priceInCents: integer("price_in_cents"),
  peakPriceInCents: integer("peak_price_in_cents"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const courtsRelations = relations(courts, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [courts.facilityId],
    references: [facilities.id],
  }),
  timeSlotTemplates: many(timeSlotTemplates),
  bookings: many(bookings),
}));

/**
 * Operating Hours - facility open/close times per day of week
 * dayOfWeek: 0=Sunday, 1=Monday, ... 6=Saturday
 */
export const operatingHours = pgTable("operating_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  facilityId: uuid("facility_id")
    .notNull()
    .references(() => facilities.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: time("open_time").notNull(),
  closeTime: time("close_time").notNull(),
  isClosed: boolean("is_closed").default(false).notNull(),
});

export const operatingHoursRelations = relations(operatingHours, ({ one }) => ({
  facility: one(facilities, {
    fields: [operatingHours.facilityId],
    references: [facilities.id],
  }),
}));

/**
 * Time Slot Templates - pricing templates for court time slots
 * If courtId is null, the template applies to all courts in the facility
 */
export const timeSlotTemplates = pgTable("time_slot_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  facilityId: uuid("facility_id")
    .notNull()
    .references(() => facilities.id, { onDelete: "cascade" }),
  courtId: uuid("court_id").references(() => courts.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(90),
  priceInCents: integer("price_in_cents").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const timeSlotTemplatesRelations = relations(timeSlotTemplates, ({ one }) => ({
  facility: one(facilities, {
    fields: [timeSlotTemplates.facilityId],
    references: [facilities.id],
  }),
  court: one(courts, {
    fields: [timeSlotTemplates.courtId],
    references: [courts.id],
  }),
}));

/**
 * Bookings table - reservations for court time slots
 */
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(), // PH-2026-XXXX

  // References
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  courtId: uuid("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  facilityId: uuid("facility_id")
    .notNull()
    .references(() => facilities.id, { onDelete: "cascade" }),

  // Booking time
  date: timestamp("date", { mode: "date" }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),

  // Pricing
  priceInCents: integer("price_in_cents").notNull(),
  isPeakRate: boolean("is_peak_rate").default(false).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),

  // Status
  status: bookingStatusEnum("status").default("pending").notNull(),

  // Cancellation
  cancelledBy: cancelledByEnum("cancelled_by"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),

  // Customer info (for manual/walk-in bookings)
  customerName: varchar("customer_name", { length: 100 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerEmail: varchar("customer_email", { length: 255 }),

  // Meta
  notes: text("notes"),
  isManualBooking: boolean("is_manual_booking").default(false).notNull(),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(user, {
    fields: [bookings.userId],
    references: [user.id],
  }),
  court: one(courts, {
    fields: [bookings.courtId],
    references: [courts.id],
  }),
  facility: one(facilities, {
    fields: [bookings.facilityId],
    references: [facilities.id],
  }),
}));

// =============================================================================
// Website Lead Capture
// =============================================================================

/**
 * Waitlist Leads - players interested in PadelHub before full launch
 */
export const waitlistLeads = pgTable("waitlist_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  district: varchar("district", { length: 100 }),
  source: varchar("source", { length: 50 }).notNull(), // homepage, directory, facility, footer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Owner Inquiries - court owners interested in onboarding
 */
export const ownerInquiries = pgTable("owner_inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  courtCount: integer("court_count"),
  district: varchar("district", { length: 100 }),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("new").notNull(), // new, contacted, converted
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =============================================================================
// Insert Schemas for Validation
// =============================================================================

export const CreateOwnerAccountSchema = createInsertSchema(ownerAccounts, {
  contactName: z.string().min(2).max(100),
  phone: z.string().min(6).max(20),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  onboardingCompletedAt: true,
});

export const CreateFacilitySchema = createInsertSchema(facilities, {
  name: z.string().min(3).max(200),
  slug: z.string().min(2).max(250),
  address: z.string().min(5).max(500),
  district: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  phone: z.string().min(6).max(20),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const CreateCourtSchema = createInsertSchema(courts, {
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  priceInCents: z.number().int().min(0).optional(),
  peakPriceInCents: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const UpdateCourtSchema = CreateCourtSchema.partial();

export const CreateBookingSchema = createInsertSchema(bookings, {
  code: z.string().min(1).max(20),
  priceInCents: z.number().int().min(0),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  customerEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
  confirmedAt: true,
});

export const CreateManualBookingSchema = z.object({
  courtId: z.string().uuid(),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  priceInCents: z.number().int().min(0),
  isPeakRate: z.boolean().default(false),
  paymentMethod: z.enum(["cash", "card", "app"]).optional(),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().max(20).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export const CreateWaitlistLeadSchema = createInsertSchema(waitlistLeads, {
  name: z.string().max(100).optional(),
  email: z.string().email("Email invalido"),
  phone: z.string().max(20).optional(),
  district: z.string().max(100).optional(),
  source: z.string().min(1).max(50),
}).omit({
  id: true,
  createdAt: true,
});

export const CreateOwnerInquirySchema = createInsertSchema(ownerInquiries, {
  businessName: z.string().min(2, "Nombre del negocio es requerido").max(200),
  contactName: z.string().min(2, "Nombre de contacto es requerido").max(100),
  email: z.string().email("Email invalido"),
  phone: z.string().min(6, "Telefono es requerido").max(20),
  courtCount: z.number().int().min(1).optional(),
  district: z.string().max(100).optional(),
  message: z.string().max(1000).optional(),
}).omit({
  id: true,
  createdAt: true,
  status: true,
});

export * from "./auth-schema";
