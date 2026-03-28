import type { APIRoute } from "astro";
import { z } from "zod";

import { and, eq } from "@wifo/db";
import { db } from "@wifo/db/client";
import { accessRequests } from "@wifo/db/schema";
import { sendAccessRequestConfirmation } from "@wifo/email";

const requestSchema = z.object({
  email: z.email({ error: "Email invalido" }),
  name: z.string().min(2, "Nombre invalido"),
  phone: z.string().optional(),
  type: z.enum(["player", "owner"]).default("owner"),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as unknown;
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Datos invalidos. Revisa tu email y nombre." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { email, name, phone, type } = parsed.data;

    // Check for duplicate (scoped to email + type)
    const existing = await db
      .select({ id: accessRequests.id })
      .from(accessRequests)
      .where(
        and(eq(accessRequests.email, email), eq(accessRequests.type, type)),
      )
      .limit(1);

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Ya recibimos tu solicitud. Te contactaremos pronto.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    await db.insert(accessRequests).values({ email, name, phone, type });

    // Send confirmation email only for owner requests
    if (type === "owner") {
      const result = await sendAccessRequestConfirmation({ email });
      if (!result.success) {
        console.error("[access-request] Email send failed:", result.error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
