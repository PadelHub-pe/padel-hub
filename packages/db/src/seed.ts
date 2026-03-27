import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  accessRequests,
  account,
  blockedSlots,
  bookingActivity,
  bookingPlayers,
  bookings,
  courts,
  facilities,
  operatingHours,
  organizationInvites,
  organizationMembers,
  organizations,
  peakPeriods,
  platformAdmins,
  user,
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

  // Extra player users
  const player1Id = randomUUID();
  const player2Id = randomUUID();
  const player3Id = randomUUID();

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
    const allEmails = [
      testEmail,
      managerEmail,
      staffEmail,
      "player1@padelhub.pe",
      "player2@padelhub.pe",
      "player3@padelhub.pe",
    ];
    for (const email of allEmails) {
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);
      const existingUserRecord = existingUser[0];
      if (existingUserRecord) {
        await db
          .delete(organizationMembers)
          .where(eq(organizationMembers.userId, existingUserRecord.id));
        await db
          .delete(bookingPlayers)
          .where(eq(bookingPlayers.userId, existingUserRecord.id));
        await db
          .delete(account)
          .where(eq(account.userId, existingUserRecord.id));
        await db.delete(user).where(eq(user.id, existingUserRecord.id));
      }
    }

    // Delete test organization (cascade will delete facilities, courts, bookings,
    // operating hours, peak periods, blocked slots)
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);
    if (existingOrg[0]) {
      const existingFacilities = await db
        .select()
        .from(facilities)
        .where(eq(facilities.organizationId, existingOrg[0].id));

      for (const facility of existingFacilities) {
        // Delete booking-related data first
        const facilityBookings = await db
          .select()
          .from(bookings)
          .where(eq(bookings.facilityId, facility.id));
        for (const booking of facilityBookings) {
          await db
            .delete(bookingPlayers)
            .where(eq(bookingPlayers.bookingId, booking.id));
          await db
            .delete(bookingActivity)
            .where(eq(bookingActivity.bookingId, booking.id));
        }
        await db.delete(bookings).where(eq(bookings.facilityId, facility.id));
        await db
          .delete(blockedSlots)
          .where(eq(blockedSlots.facilityId, facility.id));
        await db
          .delete(peakPeriods)
          .where(eq(peakPeriods.facilityId, facility.id));
        await db
          .delete(operatingHours)
          .where(eq(operatingHours.facilityId, facility.id));
        await db.delete(courts).where(eq(courts.facilityId, facility.id));
        await db.delete(facilities).where(eq(facilities.id, facility.id));
      }

      await db
        .delete(organizationMembers)
        .where(eq(organizationMembers.organizationId, existingOrg[0].id));
      await db
        .delete(organizationInvites)
        .where(eq(organizationInvites.organizationId, existingOrg[0].id));
      await db
        .delete(organizations)
        .where(eq(organizations.id, existingOrg[0].id));
    }

    // Clean up platform admins and access requests
    await db.delete(platformAdmins);
    const testAccessEmails = [
      "contacto@padelmania.pe",
      "info@acepadel.pe",
      "admin@matchpoint.pe",
    ];
    for (const email of testAccessEmails) {
      await db.delete(accessRequests).where(eq(accessRequests.email, email));
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
      phone: "+51999888777",
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
      phone: "+51987654321",
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
      phone: "+51912345678",
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

    // Player users (for booking player data)
    await db.insert(user).values({
      id: player1Id,
      name: "Miguel Torres",
      email: "player1@padelhub.pe",
      emailVerified: true,
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: player1Id,
      providerId: "credential",
      userId: player1Id,
      password: hashedPassword,
    });

    await db.insert(user).values({
      id: player2Id,
      name: "Fernanda Ríos",
      email: "player2@padelhub.pe",
      emailVerified: true,
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: player2Id,
      providerId: "credential",
      userId: player2Id,
      password: hashedPassword,
    });

    await db.insert(user).values({
      id: player3Id,
      name: "Javier Campos",
      email: "player3@padelhub.pe",
      emailVerified: true,
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: player3Id,
      providerId: "credential",
      userId: player3Id,
      password: hashedPassword,
    });

    console.log("✅ Created 3 additional player users\n");

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

    // Pending invite
    await db.insert(organizationInvites).values({
      id: randomUUID(),
      organizationId: orgId,
      email: "invited@padelhub.pe",
      role: "facility_manager",
      facilityIds: [facility1Id],
      status: "pending",
      invitedBy: userId,
      token: randomUUID().replace(/-/g, ""),
      expiresAt: addDays(new Date(), 7),
    });

    console.log(
      "✅ Created pending invite: invited@padelhub.pe (facility_manager)\n",
    );

    // ==========================================================================
    // CREATE PLATFORM ADMIN
    // ==========================================================================

    await db.insert(platformAdmins).values({
      userId: userId,
    });

    console.log("✅ Created platform admin: owner@padelhub.pe\n");

    // ==========================================================================
    // CREATE ACCESS REQUESTS (for admin panel testing)
    // ==========================================================================

    await db.insert(accessRequests).values({
      email: "contacto@padelmania.pe",
      name: "Ricardo Palma",
      phone: "+51998877665",
      facilityName: "Padel Manía",
      district: "Surco",
      courtCount: 4,
      status: "pending",
    });

    await db.insert(accessRequests).values({
      email: "info@acepadel.pe",
      name: "Valentina Reyes",
      phone: "+51987654123",
      facilityName: "Ace Padel Club",
      district: "San Borja",
      courtCount: 6,
      status: "pending",
    });

    await db.insert(accessRequests).values({
      email: "admin@matchpoint.pe",
      name: "Carlos Rojas",
      phone: "+51976543210",
      facilityName: "Match Point Padel",
      district: "La Molina",
      courtCount: 3,
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: userId,
      notes: "No se pudo verificar información del local",
    });

    console.log("✅ Created 3 access requests (2 pending, 1 rejected)\n");

    // ==========================================================================
    // CREATE FACILITIES
    // ==========================================================================

    await db.insert(facilities).values({
      id: facility1Id,
      organizationId: orgId,
      name: "Padel Club San Isidro",
      slug: "padel-club-san-isidro",
      description:
        "Nuestro club principal con canchas de primer nivel en el corazón de San Isidro",
      address: "Av. Javier Prado Este 1234",
      district: "San Isidro",
      city: "Lima",
      phone: "+51999888777",
      email: "sanisidro@padelgrouplima.pe",
      website: "https://padelgrouplima.pe/sanisidro",
      amenities: [
        "estacionamiento",
        "vestuarios",
        "cafeteria",
        "tienda",
        "wifi",
      ],
      photos: [
        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop",
      ],
      defaultPriceInCents: 7000,
      defaultPeakPriceInCents: 9000,
      allowedDurationMinutes: [60, 90],
      isActive: true,
      onboardingCompletedAt: new Date(),
    });

    await db.insert(facilities).values({
      id: facility2Id,
      organizationId: orgId,
      name: "Padel Club Miraflores",
      slug: "padel-club-miraflores",
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
      defaultPriceInCents: 9000,
      defaultPeakPriceInCents: 11500,
      allowedDurationMinutes: [60, 90, 120],
      isActive: true,
      onboardingCompletedAt: new Date(),
    });

    await db.insert(facilities).values({
      id: facility3Id,
      organizationId: orgId,
      name: "Padel Club La Molina",
      slug: "padel-club-la-molina",
      description: "Próximamente - Nuestro nuevo club en La Molina",
      address: "Av. La Fontana 789",
      district: "La Molina",
      city: "Lima",
      phone: "+51999666555",
      email: "lamolina@padelgrouplima.pe",
      amenities: ["estacionamiento", "vestuarios"],
      photos: [],
      isActive: false,
    });

    console.log("✅ Created 3 facilities:");
    console.log("   • Padel Club San Isidro (active, defaults S/.70/S/.90)");
    console.log("   • Padel Club Miraflores (active, defaults S/.90/S/.115)");
    console.log("   • Padel Club La Molina (inactive)\n");

    // ==========================================================================
    // CREATE OPERATING HOURS
    // ==========================================================================

    // Helper to insert a week of operating hours
    async function insertOperatingHours(
      facilityId: string,
      schedule: {
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed?: boolean;
      }[],
    ) {
      for (const day of schedule) {
        await db.insert(operatingHours).values({
          id: randomUUID(),
          facilityId,
          dayOfWeek: day.dayOfWeek,
          openTime: day.openTime,
          closeTime: day.closeTime,
          isClosed: day.isClosed ?? false,
        });
      }
    }

    // San Isidro: Mon-Fri 07:00-22:00, Sat 08:00-22:00, Sun 08:00-20:00
    await insertOperatingHours(facility1Id, [
      { dayOfWeek: 0, openTime: "08:00", closeTime: "20:00" }, // Sun
      { dayOfWeek: 1, openTime: "07:00", closeTime: "22:00" }, // Mon
      { dayOfWeek: 2, openTime: "07:00", closeTime: "22:00" }, // Tue
      { dayOfWeek: 3, openTime: "07:00", closeTime: "22:00" }, // Wed
      { dayOfWeek: 4, openTime: "07:00", closeTime: "22:00" }, // Thu
      { dayOfWeek: 5, openTime: "07:00", closeTime: "22:00" }, // Fri
      { dayOfWeek: 6, openTime: "08:00", closeTime: "22:00" }, // Sat
    ]);

    // Miraflores: Mon-Fri 07:00-23:00, Sat 07:00-23:00, Sun 08:00-21:00
    await insertOperatingHours(facility2Id, [
      { dayOfWeek: 0, openTime: "08:00", closeTime: "21:00" }, // Sun
      { dayOfWeek: 1, openTime: "07:00", closeTime: "23:00" }, // Mon
      { dayOfWeek: 2, openTime: "07:00", closeTime: "23:00" }, // Tue
      { dayOfWeek: 3, openTime: "07:00", closeTime: "23:00" }, // Wed
      { dayOfWeek: 4, openTime: "07:00", closeTime: "23:00" }, // Thu
      { dayOfWeek: 5, openTime: "07:00", closeTime: "23:00" }, // Fri
      { dayOfWeek: 6, openTime: "07:00", closeTime: "23:00" }, // Sat
    ]);

    console.log("✅ Created operating hours:");
    console.log("   • San Isidro: Mon-Fri 07-22, Sat 08-22, Sun 08-20");
    console.log("   • Miraflores: Mon-Sat 07-23, Sun 08-21\n");

    // ==========================================================================
    // CREATE PEAK PERIODS
    // ==========================================================================

    // San Isidro: Evening peak Mon-Fri, Weekend morning peak
    await db.insert(peakPeriods).values({
      id: randomUUID(),
      facilityId: facility1Id,
      name: "Hora Punta Noche",
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      startTime: "18:00",
      endTime: "22:00",
      markupPercent: 50,
      isActive: true,
    });

    await db.insert(peakPeriods).values({
      id: randomUUID(),
      facilityId: facility1Id,
      name: "Fin de Semana",
      daysOfWeek: [0, 6], // Sat-Sun
      startTime: "09:00",
      endTime: "13:00",
      markupPercent: 30,
      isActive: true,
    });

    // Miraflores: Evening peak Mon-Fri, Saturday premium
    await db.insert(peakPeriods).values({
      id: randomUUID(),
      facilityId: facility2Id,
      name: "Hora Punta",
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      startTime: "18:00",
      endTime: "23:00",
      markupPercent: 40,
      isActive: true,
    });

    await db.insert(peakPeriods).values({
      id: randomUUID(),
      facilityId: facility2Id,
      name: "Sábado Premium",
      daysOfWeek: [6], // Sat
      startTime: "10:00",
      endTime: "14:00",
      markupPercent: 50,
      isActive: true,
    });

    console.log("✅ Created peak periods:");
    console.log(
      "   • San Isidro: Noche L-V 18-22h (+50%), Fin de semana 09-13h (+30%)",
    );
    console.log(
      "   • Miraflores: Noche L-V 18-23h (+40%), Sábado 10-14h (+50%)\n",
    );

    // ==========================================================================
    // CREATE COURTS
    // ==========================================================================

    // San Isidro courts — mix of custom and facility-default pricing
    const facility1Courts = [
      {
        name: "Cancha 1",
        type: "indoor" as const,
        priceInCents: 8000, // Custom: S/.80
        peakPriceInCents: 10000, // Custom peak: S/.100
      },
      {
        name: "Cancha 2",
        type: "indoor" as const,
        priceInCents: null, // Uses facility default: S/.70
        peakPriceInCents: null, // Uses facility default peak: S/.90
      },
      {
        name: "Cancha 3",
        type: "outdoor" as const,
        priceInCents: 6000, // Custom: S/.60
        peakPriceInCents: null, // Uses facility default peak: S/.90
      },
      {
        name: "Cancha 4",
        type: "outdoor" as const,
        priceInCents: null, // Uses facility default
        peakPriceInCents: null, // Uses facility default peak
        status: "maintenance" as const,
      },
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

    // Miraflores courts — mix of custom and facility-default pricing
    const facility2Courts = [
      {
        name: "Cancha Premium 1",
        type: "indoor" as const,
        priceInCents: 10000, // Custom: S/.100
        peakPriceInCents: 12500, // Custom peak: S/.125
      },
      {
        name: "Cancha Premium 2",
        type: "indoor" as const,
        priceInCents: null, // Uses facility default: S/.90
        peakPriceInCents: null, // Uses facility default peak: S/.115
      },
      {
        name: "Cancha Vista Mar",
        type: "outdoor" as const,
        priceInCents: 8500, // Custom: S/.85
        peakPriceInCents: null, // Uses facility default peak: S/.115
      },
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

    // La Molina courts — inactive, no pricing needed yet
    const facility3Courts = [
      { name: "Cancha A", type: "indoor" as const },
      { name: "Cancha B", type: "indoor" as const },
    ];

    for (const court of facility3Courts) {
      await db.insert(courts).values({
        id: randomUUID(),
        facilityId: facility3Id,
        name: court.name,
        type: court.type,
        status: "inactive",
        isActive: false,
      });
    }

    const totalCourts =
      facility1Courts.length + facility2Courts.length + facility3Courts.length;
    console.log(`✅ Created ${totalCourts} courts:`);
    console.log(
      "   • San Isidro: 2 indoor (1 custom, 1 default), 2 outdoor (1 in maintenance)",
    );
    console.log(
      "   • Miraflores: 2 indoor (1 custom, 1 default), 1 outdoor custom",
    );
    console.log("   • La Molina: 2 indoor (inactive)\n");

    // ==========================================================================
    // CREATE BLOCKED SLOTS
    // ==========================================================================

    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = addDays(new Date(), 2);
    dayAfterTomorrow.setHours(0, 0, 0, 0);

    // Court-specific maintenance block
    await db.insert(blockedSlots).values({
      id: randomUUID(),
      facilityId: facility1Id,
      courtId: facility1CourtIds[3] ?? null, // Cancha 4
      date: tomorrow,
      startTime: "08:00",
      endTime: "12:00",
      reason: "maintenance",
      notes: "Reparación de cristal lateral",
      createdBy: userId,
    });

    // Facility-wide tournament block
    await db.insert(blockedSlots).values({
      id: randomUUID(),
      facilityId: facility1Id,
      courtId: null, // All courts
      date: dayAfterTomorrow,
      startTime: "14:00",
      endTime: "20:00",
      reason: "tournament",
      notes: "Torneo interno Padel Group Lima",
      createdBy: userId,
    });

    console.log("✅ Created blocked slots:");
    console.log("   • Tomorrow: Cancha 4 maintenance 08-12h");
    console.log("   • Day after tomorrow: All courts tournament 14-20h\n");

    // ==========================================================================
    // CREATE BOOKINGS WITH PLAYERS AND ACTIVITY
    // ==========================================================================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper to insert a booking with players and activity
    async function createBookingWithPlayers(
      bookingData: {
        code: string;
        courtId: string;
        facilityId: string;
        date: Date;
        startTime: string;
        endTime: string;
        status:
          | "pending"
          | "confirmed"
          | "in_progress"
          | "completed"
          | "cancelled"
          | "open_match";
        customerName: string;
        customerEmail?: string;
        customerPhone?: string;
        priceInCents: number;
        isPeakRate: boolean;
        isManualBooking?: boolean;
        paymentMethod?: "cash" | "card" | "app";
        cancelledBy?: "user" | "owner" | "system";
        cancellationReason?: string;
      },
      players: {
        userId?: string;
        role: "owner" | "player";
        position: number;
        guestName?: string;
        guestEmail?: string;
        guestPhone?: string;
      }[],
    ) {
      const bookingId = randomUUID();

      await db.insert(bookings).values({
        id: bookingId,
        code: bookingData.code,
        courtId: bookingData.courtId,
        facilityId: bookingData.facilityId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        priceInCents: bookingData.priceInCents,
        isPeakRate: bookingData.isPeakRate,
        status: bookingData.status,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail ?? null,
        customerPhone: bookingData.customerPhone ?? null,
        isManualBooking: bookingData.isManualBooking ?? false,
        paymentMethod: bookingData.paymentMethod ?? null,
        cancelledBy: bookingData.cancelledBy ?? null,
        cancellationReason: bookingData.cancellationReason ?? null,
        cancelledAt: bookingData.status === "cancelled" ? new Date() : null,
        confirmedAt: ["confirmed", "in_progress", "completed"].includes(
          bookingData.status,
        )
          ? new Date()
          : null,
      });

      // Insert players
      for (const player of players) {
        await db.insert(bookingPlayers).values({
          id: randomUUID(),
          bookingId,
          userId: player.userId ?? null,
          role: player.role,
          position: player.position,
          guestName: player.guestName ?? null,
          guestEmail: player.guestEmail ?? null,
          guestPhone: player.guestPhone ?? null,
        });
      }

      // Insert "created" activity
      await db.insert(bookingActivity).values({
        id: randomUUID(),
        bookingId,
        type: "created",
        description: `Reserva creada para ${bookingData.customerName}`,
        metadata: {},
        performedBy: userId,
      });

      // Add player_joined activities for non-owner players
      for (const player of players) {
        if (player.role === "player") {
          const name = player.guestName ?? "Jugador";
          await db.insert(bookingActivity).values({
            id: randomUUID(),
            bookingId,
            type: "player_joined",
            description: `${name} se unió en posición ${player.position}`,
            metadata: { position: player.position },
            performedBy: userId,
          });
        }
      }

      // Add status-specific activities
      if (bookingData.status === "confirmed") {
        await db.insert(bookingActivity).values({
          id: randomUUID(),
          bookingId,
          type: "confirmed",
          description: "Reserva confirmada",
          metadata: {},
          performedBy: userId,
        });
      } else if (bookingData.status === "cancelled") {
        await db.insert(bookingActivity).values({
          id: randomUUID(),
          bookingId,
          type: "cancelled",
          description: bookingData.cancellationReason
            ? `Reserva cancelada: ${bookingData.cancellationReason}`
            : "Reserva cancelada",
          metadata: {},
          performedBy: userId,
        });
      } else if (bookingData.status === "completed") {
        await db.insert(bookingActivity).values({
          id: randomUUID(),
          bookingId,
          type: "confirmed",
          description: "Reserva confirmada",
          metadata: {},
          performedBy: userId,
        });
        await db.insert(bookingActivity).values({
          id: randomUUID(),
          bookingId,
          type: "completed",
          description: "Partido completado",
          metadata: {},
          performedBy: userId,
        });
      }

      return bookingId;
    }

    // ---- Facility 1 Bookings (San Isidro) ----

    // Today: confirmed, 4/4 players, Cancha 1 (custom S/.80)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-8X4K`,
        courtId: facility1CourtIds[0] ?? "",
        facilityId: facility1Id,
        date: today,
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed",
        customerName: "Roberto Silva",
        customerEmail: "roberto.s@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      [
        { userId: player1Id, role: "owner", position: 1 },
        { userId: player2Id, role: "player", position: 2 },
        { userId: player3Id, role: "player", position: 3 },
        {
          guestName: "Roberto Silva",
          guestEmail: "roberto.s@email.com",
          role: "player",
          position: 4,
        },
      ],
    );

    // Today: confirmed, 3/4 players, Cancha 2 (facility default S/.70)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-9Y5L`,
        courtId: facility1CourtIds[1] ?? "",
        facilityId: facility1Id,
        date: today,
        startTime: "10:00",
        endTime: "11:30",
        status: "confirmed",
        customerName: "María Torres",
        customerEmail: "maria.t@email.com",
        priceInCents: 7000,
        isPeakRate: false,
      },
      [
        { userId: managerUserId, role: "owner", position: 1 },
        { userId: player1Id, role: "player", position: 2 },
        {
          guestName: "María Torres",
          guestEmail: "maria.t@email.com",
          role: "player",
          position: 3,
        },
      ],
    );

    // Today: in_progress, 4/4 players, Cancha 1 (custom peak S/.100)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-7Z3M`,
        courtId: facility1CourtIds[0] ?? "",
        facilityId: facility1Id,
        date: today,
        startTime: "11:00",
        endTime: "12:30",
        status: "in_progress",
        customerName: "Pedro Sánchez",
        customerPhone: "+51999888777",
        priceInCents: 10000,
        isPeakRate: true,
      },
      [
        { userId: userId, role: "owner", position: 1 },
        { userId: player2Id, role: "player", position: 2 },
        {
          guestName: "Pedro Sánchez",
          guestPhone: "+51999888777",
          role: "player",
          position: 3,
        },
        {
          guestName: "Carmen López",
          guestEmail: "carmen.l@email.com",
          role: "player",
          position: 4,
        },
      ],
    );

    // Today: pending, 1/4 player, Cancha 3 (custom S/.60, peak uses facility default S/.90)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-6W2N`,
        courtId: facility1CourtIds[2] ?? "",
        facilityId: facility1Id,
        date: today,
        startTime: "18:00",
        endTime: "19:30",
        status: "pending",
        customerName: "Sofia Reyes",
        customerEmail: "sofia.r@email.com",
        priceInCents: 9000,
        isPeakRate: true,
      },
      [
        {
          guestName: "Sofia Reyes",
          guestEmail: "sofia.r@email.com",
          role: "owner",
          position: 1,
        },
      ],
    );

    // Today: OPEN MATCH, 2/4 players, Cancha 2 (facility default peak S/.90)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-OM1A`,
        courtId: facility1CourtIds[1] ?? "",
        facilityId: facility1Id,
        date: today,
        startTime: "18:00",
        endTime: "19:30",
        status: "open_match",
        customerName: "Miguel Torres",
        customerEmail: "player1@padelhub.pe",
        priceInCents: 9000,
        isPeakRate: true,
      },
      [
        { userId: player1Id, role: "owner", position: 1 },
        { userId: player3Id, role: "player", position: 3 },
      ],
    );

    // Tomorrow: confirmed, 2/4 players
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-5V1P`,
        courtId: facility1CourtIds[0] ?? "",
        facilityId: facility1Id,
        date: addDays(today, 1),
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed",
        customerName: "Diego Ramírez",
        customerEmail: "diego.r@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      [
        {
          guestName: "Diego Ramírez",
          guestEmail: "diego.r@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player2Id, role: "player", position: 2 },
      ],
    );

    // Tomorrow: confirmed, 4/4 players, evening peak
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-4U0Q`,
        courtId: facility1CourtIds[1] ?? "",
        facilityId: facility1Id,
        date: addDays(today, 1),
        startTime: "17:00",
        endTime: "18:30",
        status: "confirmed",
        customerName: "Elena Flores",
        customerEmail: "elena.f@email.com",
        priceInCents: 9000,
        isPeakRate: true,
      },
      [
        {
          guestName: "Elena Flores",
          guestEmail: "elena.f@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player1Id, role: "player", position: 2 },
        { userId: player2Id, role: "player", position: 3 },
        { userId: player3Id, role: "player", position: 4 },
      ],
    );

    // Past: completed, 4/4 players
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-3T9R`,
        courtId: facility1CourtIds[0] ?? "",
        facilityId: facility1Id,
        date: addDays(today, -1),
        startTime: "10:00",
        endTime: "11:30",
        status: "completed",
        customerName: "Carmen López",
        customerEmail: "carmen.l@email.com",
        priceInCents: 8000,
        isPeakRate: false,
      },
      [
        {
          guestName: "Carmen López",
          guestEmail: "carmen.l@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player1Id, role: "player", position: 2 },
        { userId: player2Id, role: "player", position: 3 },
        { userId: player3Id, role: "player", position: 4 },
      ],
    );

    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-2S8S`,
        courtId: facility1CourtIds[1] ?? "",
        facilityId: facility1Id,
        date: addDays(today, -1),
        startTime: "18:00",
        endTime: "19:30",
        status: "completed",
        customerName: "Jorge Medina",
        customerEmail: "jorge.m@email.com",
        priceInCents: 9000,
        isPeakRate: true,
      },
      [
        {
          guestName: "Jorge Medina",
          guestEmail: "jorge.m@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player1Id, role: "player", position: 2 },
      ],
    );

    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-1R7T`,
        courtId: facility1CourtIds[2] ?? "",
        facilityId: facility1Id,
        date: addDays(today, -3),
        startTime: "16:00",
        endTime: "17:30",
        status: "completed",
        customerName: "Paula Castro",
        customerPhone: "+51987654321",
        priceInCents: 6000,
        isPeakRate: false,
        isManualBooking: true,
        paymentMethod: "cash",
      },
      [
        {
          guestName: "Paula Castro",
          guestPhone: "+51987654321",
          role: "owner",
          position: 1,
        },
      ],
    );

    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-0Q6U`,
        courtId: facility1CourtIds[0] ?? "",
        facilityId: facility1Id,
        date: addDays(today, -5),
        startTime: "19:00",
        endTime: "20:30",
        status: "completed",
        customerName: "Andrés Vega",
        customerEmail: "andres.v@email.com",
        priceInCents: 10000,
        isPeakRate: true,
      },
      [
        {
          guestName: "Andrés Vega",
          guestEmail: "andres.v@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player1Id, role: "player", position: 2 },
        { userId: player2Id, role: "player", position: 3 },
        {
          guestName: "Laura Ríos",
          guestEmail: "laura.r@email.com",
          role: "player",
          position: 4,
        },
      ],
    );

    // Cancelled booking
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-XC1A`,
        courtId: facility1CourtIds[1] ?? "",
        facilityId: facility1Id,
        date: addDays(today, -2),
        startTime: "14:00",
        endTime: "15:30",
        status: "cancelled",
        customerName: "Laura Ríos",
        customerEmail: "laura.r@email.com",
        priceInCents: 7000,
        isPeakRate: false,
        cancelledBy: "user",
        cancellationReason: "No puedo asistir por motivos personales",
      },
      [
        {
          guestName: "Laura Ríos",
          guestEmail: "laura.r@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player2Id, role: "player", position: 2 },
      ],
    );

    // ---- Facility 2 Bookings (Miraflores) ----

    // Today: confirmed, Cancha Premium 1 (custom S/.100)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-MF1A`,
        courtId: facility2CourtIds[0] ?? "",
        facilityId: facility2Id,
        date: today,
        startTime: "08:00",
        endTime: "09:30",
        status: "confirmed",
        customerName: "Ricardo Paz",
        customerEmail: "ricardo.p@email.com",
        priceInCents: 10000,
        isPeakRate: false,
      },
      [
        {
          guestName: "Ricardo Paz",
          guestEmail: "ricardo.p@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player1Id, role: "player", position: 2 },
        { userId: player3Id, role: "player", position: 3 },
        {
          guestName: "Ana María",
          guestEmail: "anamaria@email.com",
          role: "player",
          position: 4,
        },
      ],
    );

    // Today: confirmed, Cancha Premium 2 (facility default S/.90)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-MF2B`,
        courtId: facility2CourtIds[1] ?? "",
        facilityId: facility2Id,
        date: today,
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed",
        customerName: "Natalia Cruz",
        customerEmail: "natalia.c@email.com",
        priceInCents: 9000,
        isPeakRate: false,
      },
      [
        {
          guestName: "Natalia Cruz",
          guestEmail: "natalia.c@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player2Id, role: "player", position: 2 },
      ],
    );

    // Today: pending, Cancha Vista Mar evening (custom S/.85, peak uses facility default S/.115)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-MF3C`,
        courtId: facility2CourtIds[2] ?? "",
        facilityId: facility2Id,
        date: today,
        startTime: "17:00",
        endTime: "18:30",
        status: "pending",
        customerName: "Fernando Gil",
        customerEmail: "fernando.g@email.com",
        priceInCents: 11500,
        isPeakRate: true,
      },
      [
        {
          guestName: "Fernando Gil",
          guestEmail: "fernando.g@email.com",
          role: "owner",
          position: 1,
        },
      ],
    );

    // Past: completed, Cancha Premium 1 (custom S/.100)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-MF4D`,
        courtId: facility2CourtIds[0] ?? "",
        facilityId: facility2Id,
        date: addDays(today, -1),
        startTime: "10:00",
        endTime: "11:30",
        status: "completed",
        customerName: "Gabriela Luna",
        customerEmail: "gabriela.l@email.com",
        priceInCents: 10000,
        isPeakRate: false,
      },
      [
        {
          guestName: "Gabriela Luna",
          guestEmail: "gabriela.l@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player1Id, role: "player", position: 2 },
        { userId: player2Id, role: "player", position: 3 },
        { userId: player3Id, role: "player", position: 4 },
      ],
    );

    // Past: completed, Cancha Premium 2 evening (facility default peak S/.115)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-MF5E`,
        courtId: facility2CourtIds[1] ?? "",
        facilityId: facility2Id,
        date: addDays(today, -2),
        startTime: "19:00",
        endTime: "20:30",
        status: "completed",
        customerName: "Martín Rojas",
        customerEmail: "martin.r@email.com",
        priceInCents: 11500,
        isPeakRate: true,
      },
      [
        {
          guestName: "Martín Rojas",
          guestEmail: "martin.r@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player3Id, role: "player", position: 2 },
      ],
    );

    // Past: completed, Cancha Vista Mar (custom S/.85)
    await createBookingWithPlayers(
      {
        code: `PH-${today.getFullYear()}-MF6F`,
        courtId: facility2CourtIds[2] ?? "",
        facilityId: facility2Id,
        date: addDays(today, -4),
        startTime: "16:00",
        endTime: "17:30",
        status: "completed",
        customerName: "Valeria Soto",
        customerEmail: "valeria.s@email.com",
        priceInCents: 8500,
        isPeakRate: false,
      },
      [
        {
          guestName: "Valeria Soto",
          guestEmail: "valeria.s@email.com",
          role: "owner",
          position: 1,
        },
        { userId: player1Id, role: "player", position: 2 },
        { userId: player2Id, role: "player", position: 3 },
      ],
    );

    const totalBookings = 12 + 6; // facility1 + facility2
    console.log(
      `✅ Created ${totalBookings} sample bookings with players and activity\n`,
    );

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
    console.log("   👤 Player 1:         player1@padelhub.pe");
    console.log("   👤 Player 2:         player2@padelhub.pe");
    console.log("   👤 Player 3:         player3@padelhub.pe");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
    );

    console.log("📊 Seeded Data Summary:");
    console.log("   • 6 Users (org_admin, facility_manager, staff, 3 players)");
    console.log("   • 1 Organization (Padel Group Lima)");
    console.log("   • 3 Facilities:");
    console.log(
      "     - Padel Club San Isidro (active, 4 courts, defaults S/.70/S/.90)",
    );
    console.log(
      "     - Padel Club Miraflores (active, 3 courts, defaults S/.90/S/.115)",
    );
    console.log("     - Padel Club La Molina (inactive, 2 courts)");
    console.log(
      `   • ${totalCourts} Courts (mix of custom + facility-default pricing)`,
    );
    console.log("   • 14 Operating hours (7 days × 2 facilities)");
    console.log("   • 4 Peak periods (evening + weekend per facility)");
    console.log("   • 2 Blocked slots (maintenance + tournament)");
    console.log(`   • ${totalBookings} Bookings with players and activity`);
    console.log("   • 1 Open Match booking (2/4 players)");
    console.log("   • 1 Platform Admin (owner@padelhub.pe)");
    console.log("   • 3 Access Requests (2 pending, 1 rejected)");
    console.log("");

    console.log("🔗 URLs to test:");
    console.log(`   • Org facilities overview: /org/${orgSlug}/facilities`);
    console.log(
      `   • Facility dashboard:      /org/${orgSlug}/facilities/{facilityId}`,
    );
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
