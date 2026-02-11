import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  user,
  account,
  facilities,
  courts,
  bookings,
  organizations,
  organizationMembers,
} from "./schema";

async function seed() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { casing: "snake_case" });

  console.log("🌱 Seeding database...\n");

  // Test user credentials
  const testEmail = "owner@padelhub.pe";
  const testPassword = "password123";
  const userId = randomUUID();
  const accountId = randomUUID();

  // Secondary user (facility manager)
  const managerEmail = "manager@padelhub.pe";
  const managerUserId = randomUUID();
  const managerAccountId = randomUUID();

  // Third user (staff)
  const staffEmail = "staff@padelhub.pe";
  const staffUserId = randomUUID();
  const staffAccountId = randomUUID();

  // Organization IDs
  const orgId = randomUUID();
  const orgSlug = "padel-group-lima";

  // Facility IDs
  const facility1Id = randomUUID();
  const facility2Id = randomUUID();
  const facility3Id = randomUUID();

  // Hash the password using Better Auth's crypto
  const hashedPassword = await hashPassword(testPassword);

  try {
    // ==========================================================================
    // CLEANUP: Remove existing test data
    // ==========================================================================
    console.log("🗑️  Cleaning up existing test data...\n");

    // Delete by emails
    for (const email of [testEmail, managerEmail, staffEmail]) {
      const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
      const existingUserRecord = existingUser[0];
      if (existingUserRecord) {
        // Delete organization memberships
        await db.delete(organizationMembers).where(eq(organizationMembers.userId, existingUserRecord.id));

        await db.delete(account).where(eq(account.userId, existingUserRecord.id));
        await db.delete(user).where(eq(user.id, existingUserRecord.id));
      }
    }

    // Delete test organization (cascade will delete facilities, courts, bookings)
    const existingOrg = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
    if (existingOrg[0]) {
      // Delete facilities (cascade will delete courts and bookings)
      const existingFacilities = await db
        .select()
        .from(facilities)
        .where(eq(facilities.organizationId, existingOrg[0].id));

      for (const facility of existingFacilities) {
        await db.delete(bookings).where(eq(bookings.facilityId, facility.id));
        await db.delete(courts).where(eq(courts.facilityId, facility.id));
        await db.delete(facilities).where(eq(facilities.id, facility.id));
      }

      await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, existingOrg[0].id));
      await db.delete(organizations).where(eq(organizations.id, existingOrg[0].id));
    }

    // ==========================================================================
    // CREATE USERS
    // ==========================================================================

    // Main owner user
    await db.insert(user).values({
      id: userId,
      name: "Carlos Mendoza",
      email: testEmail,
      emailVerified: true,
    });

    await db.insert(account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
    });

    console.log("✅ Created owner user:");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Name: Carlos Mendoza\n`);

    // Manager user
    await db.insert(user).values({
      id: managerUserId,
      name: "Ana García",
      email: managerEmail,
      emailVerified: true,
    });

    await db.insert(account).values({
      id: managerAccountId,
      accountId: managerUserId,
      providerId: "credential",
      userId: managerUserId,
      password: hashedPassword,
    });

    console.log("✅ Created manager user:");
    console.log(`   Email: ${managerEmail}`);
    console.log(`   Name: Ana García\n`);

    // Staff user
    await db.insert(user).values({
      id: staffUserId,
      name: "Luis Vargas",
      email: staffEmail,
      emailVerified: true,
    });

    await db.insert(account).values({
      id: staffAccountId,
      accountId: staffUserId,
      providerId: "credential",
      userId: staffUserId,
      password: hashedPassword,
    });

    console.log("✅ Created staff user:");
    console.log(`   Email: ${staffEmail}`);
    console.log(`   Name: Luis Vargas\n`);

    // ==========================================================================
    // CREATE ORGANIZATION
    // ==========================================================================

    await db.insert(organizations).values({
      id: orgId,
      name: "Padel Group Lima",
      slug: orgSlug,
      contactEmail: "admin@padelgrouplima.pe",
      contactPhone: "+51999888777",
      isActive: true,
    });

    console.log("✅ Created organization: Padel Group Lima\n");

    // ==========================================================================
    // CREATE ORGANIZATION MEMBERS
    // ==========================================================================

    // Owner as org_admin
    await db.insert(organizationMembers).values({
      id: randomUUID(),
      organizationId: orgId,
      userId: userId,
      role: "org_admin",
      facilityIds: [],
    });

    // Manager with access to facility 1 and 2
    await db.insert(organizationMembers).values({
      id: randomUUID(),
      organizationId: orgId,
      userId: managerUserId,
      role: "facility_manager",
      facilityIds: [facility1Id, facility2Id],
    });

    // Staff with access to facility 1 only
    await db.insert(organizationMembers).values({
      id: randomUUID(),
      organizationId: orgId,
      userId: staffUserId,
      role: "staff",
      facilityIds: [facility1Id],
    });

    console.log("✅ Created organization members:");
    console.log("   • Carlos Mendoza (org_admin)");
    console.log("   • Ana García (facility_manager)");
    console.log("   • Luis Vargas (staff)\n");

    // ==========================================================================
    // CREATE FACILITIES
    // ==========================================================================

    // Facility 1: Main club in San Isidro (active, setup complete)
    await db.insert(facilities).values({
      id: facility1Id,
      organizationId: orgId,
      name: "Padel Club San Isidro",
      description: "Nuestro club principal con canchas de primer nivel en el corazón de San Isidro",
      address: "Av. Javier Prado Este 1234",
      district: "San Isidro",
      city: "Lima",
      phone: "+51999888777",
      email: "sanisidro@padelgrouplima.pe",
      website: "https://padelgrouplima.pe/sanisidro",
      amenities: ["estacionamiento", "vestuarios", "cafeteria", "tienda", "wifi"],
      photos: [
        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop",
      ],
      isActive: true,
      onboardingCompletedAt: new Date(),
    });

    // Facility 2: Miraflores location (active, setup complete)
    await db.insert(facilities).values({
      id: facility2Id,
      organizationId: orgId,
      name: "Padel Club Miraflores",
      description: "Club moderno cerca al malecón con vista al mar",
      address: "Calle Schell 456",
      district: "Miraflores",
      city: "Lima",
      phone: "+51999777666",
      email: "miraflores@padelgrouplima.pe",
      amenities: ["estacionamiento", "vestuarios", "bar", "terraza"],
      photos: [
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=400&fit=crop",
      ],
      isActive: true,
      onboardingCompletedAt: new Date(),
    });

    // Facility 3: La Molina location (inactive - setup not complete)
    await db.insert(facilities).values({
      id: facility3Id,
      organizationId: orgId,
      name: "Padel Club La Molina",
      description: "Próximamente - Nuestro nuevo club en La Molina",
      address: "Av. La Fontana 789",
      district: "La Molina",
      city: "Lima",
      phone: "+51999666555",
      email: "lamolina@padelgrouplima.pe",
      amenities: ["estacionamiento", "vestuarios"],
      photos: [],
      isActive: false,
      // onboardingCompletedAt: null - setup not complete
    });

    console.log("✅ Created 3 facilities:");
    console.log("   • Padel Club San Isidro (active)");
    console.log("   • Padel Club Miraflores (active)");
    console.log("   • Padel Club La Molina (inactive)\n");

    // ==========================================================================
    // CREATE COURTS
    // ==========================================================================

    // Courts for Facility 1 (San Isidro) - 4 courts
    const facility1Courts = [
      { name: "Cancha 1", type: "indoor" as const, priceInCents: 8000, peakPriceInCents: 10000 },
      { name: "Cancha 2", type: "indoor" as const, priceInCents: 8000, peakPriceInCents: 10000 },
      { name: "Cancha 3", type: "outdoor" as const, priceInCents: 6000, peakPriceInCents: 8000 },
      { name: "Cancha 4", type: "outdoor" as const, priceInCents: 6000, peakPriceInCents: 8000, status: "maintenance" as const },
    ];

    const facility1CourtIds: string[] = [];
    for (const court of facility1Courts) {
      const courtId = randomUUID();
      facility1CourtIds.push(courtId);
      await db.insert(courts).values({
        id: courtId,
        facilityId: facility1Id,
        name: court.name,
        type: court.type,
        status: court.status ?? "active",
        priceInCents: court.priceInCents,
        peakPriceInCents: court.peakPriceInCents,
      });
    }

    // Courts for Facility 2 (Miraflores) - 3 courts
    const facility2Courts = [
      { name: "Cancha Premium 1", type: "indoor" as const, priceInCents: 10000, peakPriceInCents: 12000 },
      { name: "Cancha Premium 2", type: "indoor" as const, priceInCents: 10000, peakPriceInCents: 12000 },
      { name: "Cancha Vista Mar", type: "outdoor" as const, priceInCents: 9000, peakPriceInCents: 11000 },
    ];

    const facility2CourtIds: string[] = [];
    for (const court of facility2Courts) {
      const courtId = randomUUID();
      facility2CourtIds.push(courtId);
      await db.insert(courts).values({
        id: courtId,
        facilityId: facility2Id,
        name: court.name,
        type: court.type,
        status: "active",
        priceInCents: court.priceInCents,
        peakPriceInCents: court.peakPriceInCents,
      });
    }

    // Courts for Facility 3 (La Molina) - 2 courts (not yet active)
    const facility3Courts = [
      { name: "Cancha A", type: "indoor" as const, priceInCents: 7000, peakPriceInCents: 9000 },
      { name: "Cancha B", type: "indoor" as const, priceInCents: 7000, peakPriceInCents: 9000 },
    ];

    for (const court of facility3Courts) {
      await db.insert(courts).values({
        id: randomUUID(),
        facilityId: facility3Id,
        name: court.name,
        type: court.type,
        status: "inactive",
        priceInCents: court.priceInCents,
        peakPriceInCents: court.peakPriceInCents,
        isActive: false,
      });
    }

    const totalCourts = facility1Courts.length + facility2Courts.length + facility3Courts.length;
    console.log(`✅ Created ${totalCourts} courts across all facilities\n`);

    // ==========================================================================
    // CREATE BOOKINGS
    // ==========================================================================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bookings for Facility 1 (San Isidro)
    const facility1Bookings = [
      // Today's bookings
      {
        code: `PH-${today.getFullYear()}-8X4K`,
        courtId: facility1CourtIds[0] ?? "",
        date: today,
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed" as const,
        customerName: "Roberto Silva",
        customerEmail: "roberto.s@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-9Y5L`,
        courtId: facility1CourtIds[1] ?? "",
        date: today,
        startTime: "10:00",
        endTime: "11:30",
        status: "confirmed" as const,
        customerName: "María Torres",
        customerEmail: "maria.t@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-7Z3M`,
        courtId: facility1CourtIds[0] ?? "",
        date: today,
        startTime: "11:00",
        endTime: "12:30",
        status: "in_progress" as const,
        customerName: "Pedro Sánchez",
        customerPhone: "+51999888777",
        priceInCents: 10000,
        isPeakRate: true,
      },
      {
        code: `PH-${today.getFullYear()}-6W2N`,
        courtId: facility1CourtIds[2] ?? "",
        date: today,
        startTime: "18:00",
        endTime: "19:30",
        status: "pending" as const,
        customerName: "Sofia Reyes",
        customerEmail: "sofia.r@email.com",
        priceInCents: 8000,
        isPeakRate: true,
      },
      // Tomorrow's bookings
      {
        code: `PH-${today.getFullYear()}-5V1P`,
        courtId: facility1CourtIds[0] ?? "",
        date: addDays(today, 1),
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed" as const,
        customerName: "Diego Ramírez",
        customerEmail: "diego.r@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-4U0Q`,
        courtId: facility1CourtIds[1] ?? "",
        date: addDays(today, 1),
        startTime: "17:00",
        endTime: "18:30",
        status: "confirmed" as const,
        customerName: "Elena Flores",
        customerEmail: "elena.f@email.com",
        priceInCents: 10000,
        isPeakRate: true,
      },
      // Past bookings (for stats)
      {
        code: `PH-${today.getFullYear()}-3T9R`,
        courtId: facility1CourtIds[0] ?? "",
        date: addDays(today, -1),
        startTime: "10:00",
        endTime: "11:30",
        status: "completed" as const,
        customerName: "Carmen López",
        customerEmail: "carmen.l@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-2S8S`,
        courtId: facility1CourtIds[1] ?? "",
        date: addDays(today, -1),
        startTime: "18:00",
        endTime: "19:30",
        status: "completed" as const,
        customerName: "Jorge Medina",
        customerEmail: "jorge.m@email.com",
        priceInCents: 10000,
        isPeakRate: true,
      },
      {
        code: `PH-${today.getFullYear()}-1R7T`,
        courtId: facility1CourtIds[2] ?? "",
        date: addDays(today, -3),
        startTime: "16:00",
        endTime: "17:30",
        status: "completed" as const,
        customerName: "Paula Castro",
        customerPhone: "+51987654321",
        priceInCents: 6000,
        isPeakRate: false,
        isManualBooking: true,
        paymentMethod: "cash" as const,
      },
      {
        code: `PH-${today.getFullYear()}-0Q6U`,
        courtId: facility1CourtIds[0] ?? "",
        date: addDays(today, -5),
        startTime: "19:00",
        endTime: "20:30",
        status: "completed" as const,
        customerName: "Andrés Vega",
        customerEmail: "andres.v@email.com",
        priceInCents: 10000,
        isPeakRate: true,
      },
      // Cancelled booking
      {
        code: `PH-${today.getFullYear()}-XC1A`,
        courtId: facility1CourtIds[1] ?? "",
        date: addDays(today, -2),
        startTime: "14:00",
        endTime: "15:30",
        status: "cancelled" as const,
        customerName: "Laura Ríos",
        customerEmail: "laura.r@email.com",
        priceInCents: 8000,
        isPeakRate: false,
        cancelledBy: "user" as const,
        cancellationReason: "No puedo asistir por motivos personales",
      },
    ];

    // Bookings for Facility 2 (Miraflores)
    const facility2Bookings = [
      // Today's bookings
      {
        code: `PH-${today.getFullYear()}-MF1A`,
        courtId: facility2CourtIds[0] ?? "",
        date: today,
        startTime: "08:00",
        endTime: "09:30",
        status: "confirmed" as const,
        customerName: "Ricardo Paz",
        customerEmail: "ricardo.p@email.com",
        priceInCents: 10000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-MF2B`,
        courtId: facility2CourtIds[1] ?? "",
        date: today,
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed" as const,
        customerName: "Natalia Cruz",
        customerEmail: "natalia.c@email.com",
        priceInCents: 10000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-MF3C`,
        courtId: facility2CourtIds[2] ?? "",
        date: today,
        startTime: "17:00",
        endTime: "18:30",
        status: "pending" as const,
        customerName: "Fernando Gil",
        customerEmail: "fernando.g@email.com",
        priceInCents: 11000,
        isPeakRate: true,
      },
      // Past bookings
      {
        code: `PH-${today.getFullYear()}-MF4D`,
        courtId: facility2CourtIds[0] ?? "",
        date: addDays(today, -1),
        startTime: "10:00",
        endTime: "11:30",
        status: "completed" as const,
        customerName: "Gabriela Luna",
        customerEmail: "gabriela.l@email.com",
        priceInCents: 10000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-MF5E`,
        courtId: facility2CourtIds[1] ?? "",
        date: addDays(today, -2),
        startTime: "19:00",
        endTime: "20:30",
        status: "completed" as const,
        customerName: "Martín Rojas",
        customerEmail: "martin.r@email.com",
        priceInCents: 12000,
        isPeakRate: true,
      },
      {
        code: `PH-${today.getFullYear()}-MF6F`,
        courtId: facility2CourtIds[2] ?? "",
        date: addDays(today, -4),
        startTime: "16:00",
        endTime: "17:30",
        status: "completed" as const,
        customerName: "Valeria Soto",
        customerEmail: "valeria.s@email.com",
        priceInCents: 9000,
        isPeakRate: false,
      },
    ];

    // Insert all bookings
    interface BookingData {
      code: string;
      courtId: string;
      facilityId: string;
      date: Date;
      startTime: string;
      endTime: string;
      status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
      customerName: string;
      customerEmail?: string;
      customerPhone?: string;
      priceInCents: number;
      isPeakRate: boolean;
      isManualBooking?: boolean;
      paymentMethod?: "cash" | "card" | "app";
      cancelledBy?: "user" | "owner" | "system";
      cancellationReason?: string;
    }

    const allBookings: BookingData[] = [
      ...facility1Bookings.map((b) => ({ ...b, facilityId: facility1Id })),
      ...facility2Bookings.map((b) => ({ ...b, facilityId: facility2Id })),
    ];

    for (const booking of allBookings) {
      await db.insert(bookings).values({
        id: randomUUID(),
        code: booking.code,
        courtId: booking.courtId,
        facilityId: booking.facilityId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        priceInCents: booking.priceInCents,
        isPeakRate: booking.isPeakRate,
        status: booking.status,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail ?? null,
        customerPhone: booking.customerPhone ?? null,
        isManualBooking: booking.isManualBooking ?? false,
        paymentMethod: booking.paymentMethod ?? null,
        cancelledBy: booking.cancelledBy ?? null,
        cancellationReason: booking.cancellationReason ?? null,
        cancelledAt: booking.status === "cancelled" ? new Date() : null,
        confirmedAt: ["confirmed", "in_progress", "completed"].includes(booking.status)
          ? new Date()
          : null,
      });
    }

    console.log(`✅ Created ${allBookings.length} sample bookings\n`);

    // ==========================================================================
    // SUMMARY
    // ==========================================================================

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Test Credentials (same password for all users):");
    console.log(`   Password: ${testPassword}`);
    console.log("");
    console.log("   👤 Org Admin:        " + testEmail);
    console.log("   👤 Facility Manager: " + managerEmail);
    console.log("   👤 Staff:            " + staffEmail);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📊 Seeded Data Summary:");
    console.log("   • 3 Users (org_admin, facility_manager, staff)");
    console.log("   • 1 Organization (Padel Group Lima)");
    console.log("   • 3 Facilities:");
    console.log("     - Padel Club San Isidro (active, 4 courts)");
    console.log("     - Padel Club Miraflores (active, 3 courts)");
    console.log("     - Padel Club La Molina (inactive, 2 courts)");
    console.log(`   • ${totalCourts} Courts total`);
    console.log(`   • ${allBookings.length} Bookings`);
    console.log("");

    console.log("🔗 URLs to test:");
    console.log(`   • Org facilities overview: /org/${orgSlug}/facilities`);
    console.log(`   • Facility dashboard:      /org/${orgSlug}/facilities/{facilityId}/dashboard`);
    console.log("");

    console.log("🎉 Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
