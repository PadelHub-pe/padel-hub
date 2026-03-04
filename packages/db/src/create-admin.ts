import { randomUUID } from "crypto";
import * as readline from "readline/promises";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { account, platformAdmins, user } from "./schema";

async function prompt(
  rl: readline.Interface,
  question: string,
): Promise<string> {
  const answer = await rl.question(question);
  return answer.trim();
}

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\n--- Create Platform Admin ---\n");

    const name = await prompt(rl, "Name: ");
    if (!name) throw new Error("Name is required");

    const email = await prompt(rl, "Email: ");
    if (!email.includes("@")) throw new Error("Valid email required");

    const password = await prompt(rl, "Password: ");
    if (password.length < 8)
      throw new Error("Password must be at least 8 characters");

    const client = postgres(connectionString);
    const db = drizzle(client, { casing: "snake_case" });

    // Check if user already exists
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existing.length > 0) {
      const existingUser = existing[0] ?? { id: "" };
      // Check if already a platform admin
      const existingAdmin = await db
        .select({ id: platformAdmins.id })
        .from(platformAdmins)
        .where(eq(platformAdmins.userId, existingUser.id))
        .limit(1);

      if (existingAdmin.length > 0) {
        console.log(`\n"${email}" is already a platform admin.`);
      } else {
        await db.insert(platformAdmins).values({ userId: existingUser.id });
        console.log(
          `\nUser "${email}" already existed — promoted to platform admin.`,
        );
      }

      await client.end();
      return;
    }

    // Create new user + account + platform admin
    const userId = randomUUID();
    const accountId = randomUUID();
    const hashedPassword = await hashPassword(password);

    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
    });

    await db.insert(account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });

    await db.insert(platformAdmins).values({ userId });

    console.log(`\nPlatform admin created: ${email}`);

    await client.end();
  } finally {
    rl.close();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
