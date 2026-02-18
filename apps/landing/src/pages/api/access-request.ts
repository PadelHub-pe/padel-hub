import type { APIRoute } from "astro";
import { z } from "zod";

import { eq } from "@wifo/db";
import { db } from "@wifo/db/client";
import { accessRequests } from "@wifo/db/schema";

const emailSchema = z.object({
  email: z.email({ error: "Email invalido" }),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Email invalido" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { email } = parsed.data;

    // Check for duplicate
    const existing = await db
      .select({ id: accessRequests.id })
      .from(accessRequests)
      .where(eq(accessRequests.email, email))
      .limit(1);

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Ya recibimos tu solicitud. Te contactaremos pronto." }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    await db.insert(accessRequests).values({ email });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
