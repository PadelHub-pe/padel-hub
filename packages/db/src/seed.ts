import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  user,
  account,
  ownerAccounts,
  facilities,
  courts,
  bookings,
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
  const ownerAccountId = randomUUID();
  const facilityId = randomUUID();

  // Hash the password using Better Auth's crypto
  const hashedPassword = await hashPassword(testPassword);

  try {
    // Delete existing test user and their accounts (if exists)
    const existingUser = await db.select().from(user).where(eq(user.email, testEmail)).limit(1);
    const existingUserRecord = existingUser[0];
    if (existingUserRecord) {
      console.log("🗑️  Removing existing test user and related data...\n");

      // Find owner account
      const existingOwner = await db
        .select()
        .from(ownerAccounts)
        .where(eq(ownerAccounts.userId, existingUserRecord.id))
        .limit(1);

      const existingOwnerRecord = existingOwner[0];
      if (existingOwnerRecord) {
        // Find facility
        const existingFacility = await db
          .select()
          .from(facilities)
          .where(eq(facilities.ownerId, existingOwnerRecord.id))
          .limit(1);

        const existingFacilityRecord = existingFacility[0];
        if (existingFacilityRecord) {
          // Delete bookings
          await db.delete(bookings).where(eq(bookings.facilityId, existingFacilityRecord.id));
          // Delete courts
          await db.delete(courts).where(eq(courts.facilityId, existingFacilityRecord.id));
          // Delete facility
          await db.delete(facilities).where(eq(facilities.id, existingFacilityRecord.id));
        }

        // Delete owner account
        await db.delete(ownerAccounts).where(eq(ownerAccounts.id, existingOwnerRecord.id));
      }

      // Delete accounts first (foreign key constraint)
      await db.delete(account).where(eq(account.userId, existingUserRecord.id));
      await db.delete(user).where(eq(user.id, existingUserRecord.id));
    }

    // Create user
    await db.insert(user).values({
      id: userId,
      name: "Test Owner",
      email: testEmail,
      emailVerified: true,
    });

    console.log("✅ Created user:");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Name: Test Owner\n`);

    // Create account with password (credential provider)
    await db.insert(account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
    });

    console.log("✅ Created account with password\n");

    // Create owner account
    await db.insert(ownerAccounts).values({
      id: ownerAccountId,
      userId: userId,
      contactName: "Carlos Mendoza",
      phone: "+51999888777",
      onboardingCompletedAt: new Date(),
    });

    console.log("✅ Created owner account\n");

    // Create facility
    await db.insert(facilities).values({
      id: facilityId,
      ownerId: ownerAccountId,
      name: "Padel Club Lima",
      slug: "padel-club-lima",
      description: "El mejor club de padel en Lima con canchas de primer nivel. Contamos con 4 canchas profesionales, estacionamiento amplio, vestuarios completos y una cafeteria con vista a las canchas.",
      address: "Av. Javier Prado Este 1234",
      district: "San Isidro",
      city: "Lima",
      phone: "+51999888777",
      email: "contacto@padelclublima.pe",
      website: "https://padelclublima.pe",
      amenities: ["estacionamiento", "vestuarios", "cafeteria", "tienda"],
      isActive: true,
    });

    console.log("✅ Created facility: Padel Club Lima\n");

    // Create additional facilities across Lima districts
    const additionalFacilities = [
      {
        name: "Mad Padel Indoor",
        slug: "mad-padel-indoor",
        description: "Primer club de padel indoor en Lima. Canchas climatizadas con iluminacion LED de ultima generacion. Ideal para jugar a cualquier hora del dia.",
        address: "Calle Los Alamos 456",
        district: "Miraflores",
        phone: "+51987654321",
        email: "info@madpadelindoor.pe",
        amenities: ["estacionamiento", "vestuarios", "cafeteria", "aire_acondicionado", "iluminacion_led"],
        courtData: [
          { name: "Cancha Indoor 1", type: "indoor" as const, price: 9000, peak: 12000 },
          { name: "Cancha Indoor 2", type: "indoor" as const, price: 9000, peak: 12000 },
          { name: "Cancha Indoor 3", type: "indoor" as const, price: 9000, peak: 12000 },
        ],
      },
      {
        name: "Peru Padel Center",
        slug: "peru-padel-center",
        description: "Centro de padel con las mejores instalaciones en Surco. Canchas outdoor con iluminacion nocturna y una tienda de equipamiento profesional.",
        address: "Av. El Polo 789",
        district: "Surco",
        phone: "+51976543210",
        email: "reservas@perupadelcenter.pe",
        website: "https://perupadelcenter.pe",
        amenities: ["estacionamiento", "vestuarios", "tienda", "iluminacion_led", "wifi"],
        courtData: [
          { name: "Cancha 1", type: "outdoor" as const, price: 7000, peak: 9000 },
          { name: "Cancha 2", type: "outdoor" as const, price: 7000, peak: 9000 },
          { name: "Cancha 3", type: "indoor" as const, price: 8500, peak: 11000 },
        ],
      },
      {
        name: "Igma Padel Center",
        slug: "igma-padel-center",
        description: "Club de padel con ambiente familiar en La Molina. Ofrecemos clases para todos los niveles y torneos semanales tipo americano.",
        address: "Calle Las Palmeras 321",
        district: "La Molina",
        phone: "+51965432109",
        amenities: ["estacionamiento", "vestuarios", "cafeteria", "tienda", "clases"],
        courtData: [
          { name: "Cancha Principal", type: "outdoor" as const, price: 6500, peak: 8500 },
          { name: "Cancha 2", type: "outdoor" as const, price: 6500, peak: 8500 },
        ],
      },
      {
        name: "Padel Beach Barranco",
        slug: "padel-beach-barranco",
        description: "Canchas de padel con vista al mar en el corazon de Barranco. Disfruta del mejor padel en un ambiente unico con terraza y bar.",
        address: "Malecon Armendariz 567",
        district: "Barranco",
        phone: "+51954321098",
        email: "hola@padelbeach.pe",
        amenities: ["estacionamiento", "vestuarios", "bar", "terraza", "wifi"],
        courtData: [
          { name: "Cancha Mar", type: "outdoor" as const, price: 7500, peak: 10000 },
          { name: "Cancha Sol", type: "outdoor" as const, price: 7500, peak: 10000 },
          { name: "Cancha Arena", type: "outdoor" as const, price: 7500, peak: 10000 },
        ],
      },
      {
        name: "Elite Padel San Borja",
        slug: "elite-padel-san-borja",
        description: "Centro deportivo de alto rendimiento enfocado en padel. Canchas de competicion con graderias y sistema de video para analisis de juego.",
        address: "Av. San Borja Sur 890",
        district: "San Borja",
        phone: "+51943210987",
        email: "contacto@elitepadel.pe",
        amenities: ["estacionamiento", "vestuarios", "cafeteria", "tienda", "video_analisis", "graderias"],
        courtData: [
          { name: "Cancha Central", type: "indoor" as const, price: 10000, peak: 13000 },
          { name: "Cancha 2", type: "indoor" as const, price: 9000, peak: 12000 },
          { name: "Cancha 3", type: "outdoor" as const, price: 7000, peak: 9000 },
          { name: "Cancha 4", type: "outdoor" as const, price: 7000, peak: 9000 },
        ],
      },
    ];

    for (const fac of additionalFacilities) {
      const facId = randomUUID();
      await db.insert(facilities).values({
        id: facId,
        ownerId: ownerAccountId,
        name: fac.name,
        slug: fac.slug,
        description: fac.description,
        address: fac.address,
        district: fac.district,
        city: "Lima",
        phone: fac.phone,
        email: fac.email ?? null,
        website: fac.website ?? null,
        amenities: fac.amenities,
        isActive: true,
      });

      for (const court of fac.courtData) {
        await db.insert(courts).values({
          id: randomUUID(),
          facilityId: facId,
          name: court.name,
          type: court.type,
          priceInCents: court.price,
          peakPriceInCents: court.peak,
        });
      }
    }

    console.log(`✅ Created ${additionalFacilities.length} additional facilities with courts\n`);

    // Create courts
    const courtData = [
      { name: "Cancha 1", type: "indoor" as const, priceInCents: 8000, peakPriceInCents: 10000 },
      { name: "Cancha 2", type: "indoor" as const, priceInCents: 8000, peakPriceInCents: 10000 },
      { name: "Cancha 3", type: "outdoor" as const, priceInCents: 6000, peakPriceInCents: 8000 },
      { name: "Cancha 4", type: "outdoor" as const, priceInCents: 6000, peakPriceInCents: 8000, status: "maintenance" as const },
    ];

    const courtIds: string[] = [];
    for (const court of courtData) {
      const courtId = randomUUID();
      courtIds.push(courtId);
      await db.insert(courts).values({
        id: courtId,
        facilityId: facilityId,
        name: court.name,
        type: court.type,
        status: court.status ?? "active",
        priceInCents: court.priceInCents,
        peakPriceInCents: court.peakPriceInCents,
      });
    }

    console.log(`✅ Created ${courtData.length} courts\n`);

    // Create sample bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Extract court IDs for bookings (we know these exist since we just created them)
    const court1Id = courtIds[0] ?? "";
    const court2Id = courtIds[1] ?? "";
    const court3Id = courtIds[2] ?? "";

    const bookingsData = [
      // Today's bookings
      {
        code: `PH-${today.getFullYear()}-8X4K`,
        courtId: court1Id,
        date: today,
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed" as const,
        customerName: "Carlos Mendoza",
        customerEmail: "carlos.m@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-9Y5L`,
        courtId: court2Id,
        date: today,
        startTime: "10:00",
        endTime: "11:30",
        status: "confirmed" as const,
        customerName: "Ana García",
        customerEmail: "ana.g@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-7Z3M`,
        courtId: court1Id,
        date: today,
        startTime: "11:00",
        endTime: "12:30",
        status: "in_progress" as const,
        customerName: "Luis Vargas",
        customerPhone: "+51999888777",
        priceInCents: 10000,
        isPeakRate: true,
      },
      {
        code: `PH-${today.getFullYear()}-6W2N`,
        courtId: court3Id,
        date: today,
        startTime: "18:00",
        endTime: "19:30",
        status: "pending" as const,
        customerName: "María Torres",
        customerEmail: "maria.t@email.com",
        priceInCents: 8000,
        isPeakRate: true,
      },
      // Tomorrow's bookings
      {
        code: `PH-${today.getFullYear()}-5V1P`,
        courtId: court1Id,
        date: addDays(today, 1),
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed" as const,
        customerName: "Pedro Sánchez",
        customerEmail: "pedro.s@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-4U0Q`,
        courtId: court2Id,
        date: addDays(today, 1),
        startTime: "17:00",
        endTime: "18:30",
        status: "confirmed" as const,
        customerName: "Sofia Reyes",
        customerEmail: "sofia.r@email.com",
        priceInCents: 10000,
        isPeakRate: true,
      },
      // Yesterday's bookings (completed/cancelled)
      {
        code: `PH-${today.getFullYear()}-3T9R`,
        courtId: court1Id,
        date: addDays(today, -1),
        startTime: "10:00",
        endTime: "11:30",
        status: "completed" as const,
        customerName: "Roberto Sánchez",
        customerEmail: "roberto.s@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      {
        code: `PH-${today.getFullYear()}-2S8S`,
        courtId: court2Id,
        date: addDays(today, -1),
        startTime: "18:00",
        endTime: "19:30",
        status: "cancelled" as const,
        customerName: "Elena Flores",
        customerEmail: "elena.f@email.com",
        priceInCents: 10000,
        isPeakRate: true,
        cancelledBy: "user" as const,
        cancellationReason: "No puedo asistir por motivos personales",
      },
      // Older bookings
      {
        code: `PH-${today.getFullYear()}-1R7T`,
        courtId: court3Id,
        date: addDays(today, -3),
        startTime: "16:00",
        endTime: "17:30",
        status: "completed" as const,
        customerName: "Diego Ramírez",
        customerPhone: "+51987654321",
        priceInCents: 6000,
        isPeakRate: false,
        isManualBooking: true,
        paymentMethod: "cash" as const,
      },
      {
        code: `PH-${today.getFullYear()}-0Q6U`,
        courtId: court1Id,
        date: addDays(today, -5),
        startTime: "19:00",
        endTime: "20:30",
        status: "completed" as const,
        customerName: "Carmen López",
        customerEmail: "carmen.l@email.com",
        priceInCents: 10000,
        isPeakRate: true,
      },
    ];

    for (const booking of bookingsData) {
      await db.insert(bookings).values({
        id: randomUUID(),
        code: booking.code,
        courtId: booking.courtId,
        facilityId: facilityId,
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

    console.log(`✅ Created ${bookingsData.length} sample bookings\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Test Credentials:");
    console.log(`   Email:    ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📊 Seeded Data Summary:");
    console.log(`   • 1 Owner Account`);
    console.log(`   • 1 Facility (Padel Club Lima)`);
    console.log(`   • ${courtData.length} Courts`);
    console.log(`   • ${bookingsData.length} Bookings`);
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
