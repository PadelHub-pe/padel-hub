/**
 * Seed script for real Lima padel facility data.
 *
 * Reads padel_lima_research.json, transforms it via facility-mapper,
 * and inserts facilities, courts, and operating hours into the database.
 *
 * Usage: pnpm -F @wifo/db seed:facilities
 */

import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  user,
  account,
  ownerAccounts,
  facilities,
  courts,
  operatingHours,
  bookings,
} from "./schema";
import { mapResearchToFacilities } from "./data/facility-mapper";

const SYSTEM_EMAIL = "system@padelhub.pe";
const SYSTEM_PASSWORD = "system-seed-account";

async function seedFacilities() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { casing: "snake_case" });

  console.log("🏟️  Seeding real facility data from research JSON...\n");

  // ── Load and transform research data ──────────────────────────────────────
  const jsonPath = join(import.meta.dirname, "data", "padel_lima_research.json");
  const rawJson = JSON.parse(readFileSync(jsonPath, "utf-8"));
  const mappedFacilities = mapResearchToFacilities(rawJson);

  console.log(`📄 Loaded ${mappedFacilities.length} facilities from research JSON\n`);

  try {
    // ── Create or find system owner account ───────────────────────────────────
    let systemUserId: string;
    let systemOwnerAccountId: string;

    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, SYSTEM_EMAIL))
      .limit(1);

    if (existingUser[0]) {
      systemUserId = existingUser[0].id;
      console.log("🔍 Found existing system user\n");

      // Find or create owner account
      const existingOwner = await db
        .select()
        .from(ownerAccounts)
        .where(eq(ownerAccounts.userId, systemUserId))
        .limit(1);

      if (existingOwner[0]) {
        systemOwnerAccountId = existingOwner[0].id;

        // Clean up existing seeded facilities (idempotent re-runs)
        console.log("🗑️  Cleaning up existing seeded facilities...\n");

        const existingFacilities = await db
          .select({ id: facilities.id })
          .from(facilities)
          .where(eq(facilities.ownerId, systemOwnerAccountId));

        for (const fac of existingFacilities) {
          await db.delete(bookings).where(eq(bookings.facilityId, fac.id));
          await db.delete(operatingHours).where(eq(operatingHours.facilityId, fac.id));
          await db.delete(courts).where(eq(courts.facilityId, fac.id));
          await db.delete(facilities).where(eq(facilities.id, fac.id));
        }
      } else {
        systemOwnerAccountId = randomUUID();
        await db.insert(ownerAccounts).values({
          id: systemOwnerAccountId,
          userId: systemUserId,
          contactName: "PadelHub System",
          phone: "+51000000000",
          onboardingCompletedAt: new Date(),
        });
      }
    } else {
      // Create system user + account + owner
      systemUserId = randomUUID();
      systemOwnerAccountId = randomUUID();
      const hashedPassword = await hashPassword(SYSTEM_PASSWORD);

      await db.insert(user).values({
        id: systemUserId,
        name: "PadelHub System",
        email: SYSTEM_EMAIL,
        emailVerified: true,
      });

      await db.insert(account).values({
        id: randomUUID(),
        accountId: systemUserId,
        providerId: "credential",
        userId: systemUserId,
        password: hashedPassword,
      });

      await db.insert(ownerAccounts).values({
        id: systemOwnerAccountId,
        userId: systemUserId,
        contactName: "PadelHub System",
        phone: "+51000000000",
        onboardingCompletedAt: new Date(),
      });

      console.log("✅ Created system user + owner account\n");
    }

    // ── Clean up any conflicting slugs (from other owners or partial runs) ───
    const slugsToSeed = mappedFacilities.map((f) => f.slug);
    const conflicting = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(inArray(facilities.slug, slugsToSeed));

    if (conflicting.length > 0) {
      console.log(`🗑️  Removing ${conflicting.length} facilities with conflicting slugs...\n`);
      for (const fac of conflicting) {
        await db.delete(bookings).where(eq(bookings.facilityId, fac.id));
        await db.delete(operatingHours).where(eq(operatingHours.facilityId, fac.id));
        await db.delete(courts).where(eq(courts.facilityId, fac.id));
        await db.delete(facilities).where(eq(facilities.id, fac.id));
      }
    }

    // ── Seed each facility ────────────────────────────────────────────────────

    let facilitiesCreated = 0;
    let courtsCreated = 0;
    let hoursCreated = 0;

    for (const mapped of mappedFacilities) {
      const facilityId = randomUUID();

      // Insert facility
      await db.insert(facilities).values({
        id: facilityId,
        ownerId: systemOwnerAccountId,
        name: mapped.name,
        slug: mapped.slug,
        description: mapped.description,
        address: mapped.address,
        district: mapped.district,
        city: mapped.city,
        phone: mapped.phone,
        whatsappPhone: mapped.whatsappPhone,
        email: mapped.email,
        website: mapped.website,
        bookingUrl: mapped.bookingUrl,
        bookingPlatform: mapped.bookingPlatform,
        latitude: mapped.latitude,
        longitude: mapped.longitude,
        googleMapsUrl: mapped.googleMapsUrl,
        googleRating: mapped.googleRating,
        googleReviewCount: mapped.googleReviewCount,
        foundedYear: mapped.foundedYear,
        socialMedia: mapped.socialMedia,
        amenities: mapped.amenities,
        coreOfferings: mapped.coreOfferings,
        photos: mapped.photos,
        isActive: mapped.isActive,
      });

      facilitiesCreated++;

      // Insert courts
      for (const court of mapped.courts) {
        await db.insert(courts).values({
          id: randomUUID(),
          facilityId,
          name: court.name,
          type: court.type,
          description: court.description,
          priceInCents: court.priceInCents,
          peakPriceInCents: court.peakPriceInCents,
        });
        courtsCreated++;
      }

      // Insert operating hours
      for (const hour of mapped.operatingHours) {
        await db.insert(operatingHours).values({
          id: randomUUID(),
          facilityId,
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isClosed: hour.isClosed,
        });
        hoursCreated++;
      }

      console.log(
        `  ✅ ${mapped.name} (${mapped.district}) — ${mapped.courts.length} courts, ${mapped.operatingHours.length} hour slots`,
      );
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Seed Summary:");
    console.log(`   • ${facilitiesCreated} facilities`);
    console.log(`   • ${courtsCreated} courts`);
    console.log(`   • ${hoursCreated} operating hour entries`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("🎉 Facility seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seedFacilities().catch((error) => {
  console.error(error);
  process.exit(1);
});
