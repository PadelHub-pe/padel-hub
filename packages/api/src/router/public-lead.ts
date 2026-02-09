import { z } from "zod/v4";

import { ownerInquiries, waitlistLeads } from "@wifo/db/schema";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const publicLeadRouter = createTRPCRouter({
  /**
   * Join the player waitlist
   * Used by: homepage, directory, facility pages, footer newsletter
   */
  joinWaitlist: publicProcedure
    .input(
      z.object({
        name: z.string().max(100).optional(),
        email: z.string().email("Email invalido"),
        phone: z.string().max(20).optional(),
        district: z.string().max(100).optional(),
        source: z
          .enum([
            "homepage",
            "homepage-bottom",
            "directory",
            "facility",
            "footer",
            "footer-newsletter",
            "waitlist-page",
          ])
          .default("homepage"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(waitlistLeads).values({
        name: input.name ?? null,
        email: input.email,
        phone: input.phone ?? null,
        district: input.district ?? null,
        source: input.source,
      });

      return { success: true };
    }),

  /**
   * Submit a court owner inquiry/contact form
   * Used by: /para-propietarios, /contacto
   */
  submitOwnerInquiry: publicProcedure
    .input(
      z.object({
        businessName: z
          .string()
          .min(2, "Nombre del negocio es requerido")
          .max(200),
        contactName: z
          .string()
          .min(2, "Nombre de contacto es requerido")
          .max(100),
        email: z.string().email("Email invalido"),
        phone: z.string().min(6, "Telefono es requerido").max(20),
        courtCount: z.number().int().min(1).optional(),
        district: z.string().max(100).optional(),
        message: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(ownerInquiries).values({
        businessName: input.businessName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        courtCount: input.courtCount ?? null,
        district: input.district ?? null,
        message: input.message ?? null,
      });

      return { success: true };
    }),
});
