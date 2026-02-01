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
}));

/**
 * Court type enum
 */
export const courtTypeEnum = pgEnum("court_type", ["indoor", "outdoor"]);

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
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export * from "./auth-schema";
