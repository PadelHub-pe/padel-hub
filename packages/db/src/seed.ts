import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, account } from "./schema";

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

  // Hash the password using Better Auth's crypto
  const hashedPassword = await hashPassword(testPassword);

  try {
    // Delete existing test user and their accounts (if exists)
    const existingUser = await db.select().from(user).where(eq(user.email, testEmail)).limit(1);
    if (existingUser.length > 0) {
      console.log("🗑️  Removing existing test user...\n");
      // Delete accounts first (foreign key constraint)
      await db.delete(account).where(eq(account.userId, existingUser[0]!.id));
      await db.delete(user).where(eq(user.id, existingUser[0]!.id));
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

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Test Credentials:");
    console.log(`   Email:    ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("🎉 Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
