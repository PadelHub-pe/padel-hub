import { TRPCError } from "@trpc/server";
import {
  organizationInvites,
  organizationMembers,
  user,
} from "@wifo/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Administrador",
  facility_manager: "Gerente de sede",
  staff: "Staff",
};

export const inviteRouter = createTRPCRouter({
  /**
   * Validate an invite token — returns invite details or error reason.
   * Public so unauthenticated users can check before registering.
   */
  validate: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.query.organizationInvites.findFirst({
        where: eq(organizationInvites.token, input.token),
        with: {
          organization: true,
        },
      });

      if (!invite) {
        return { valid: false as const, error: "invalid" as const };
      }

      if (invite.status === "accepted") {
        return { valid: false as const, error: "used" as const };
      }

      if (invite.status === "expired" || invite.expiresAt < new Date()) {
        return { valid: false as const, error: "expired" as const };
      }

      // Check if email already has an account
      const existingUser = await ctx.db.query.user.findFirst({
        where: eq(user.email, invite.email),
      });

      return {
        valid: true as const,
        invite: {
          email: invite.email,
          role: invite.role,
          roleLabel: ROLE_LABELS[invite.role] ?? invite.role,
          organizationName: invite.organization.name,
          organizationSlug: invite.organization.slug,
        },
        emailHasAccount: !!existingUser,
      };
    }),

  /**
   * Accept an invite by creating a new account.
   * For users who don't have an account yet.
   */
  accept: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        name: z.string().min(2),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find and validate the invite
      const invite = await ctx.db.query.organizationInvites.findFirst({
        where: and(
          eq(organizationInvites.token, input.token),
          eq(organizationInvites.status, "pending"),
        ),
        with: {
          organization: true,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitación no válida o ya fue utilizada.",
        });
      }

      if (invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta invitación ha expirado.",
        });
      }

      // Check if email already has an account
      const existingUser = await ctx.db.query.user.findFirst({
        where: eq(user.email, invite.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Ya existe una cuenta con este email. Inicia sesión y acepta la invitación.",
        });
      }

      // Create the user via Better Auth
      const signUpResult = await ctx.authApi.signUpEmail({
        body: {
          email: invite.email,
          password: input.password,
          name: input.name,
        },
      });

      // Create organization membership
      await ctx.db.insert(organizationMembers).values({
        organizationId: invite.organizationId,
        userId: signUpResult.user.id,
        role: invite.role,
        facilityIds: invite.facilityIds ?? [],
      });

      // Mark invite as accepted
      await ctx.db
        .update(organizationInvites)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(organizationInvites.id, invite.id));

      return {
        success: true,
        email: invite.email,
        organizationSlug: invite.organization.slug,
      };
    }),

  /**
   * Accept an invite for an existing authenticated user.
   * Validates that the logged-in user's email matches the invite.
   */
  acceptExisting: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.query.organizationInvites.findFirst({
        where: and(
          eq(organizationInvites.token, input.token),
          eq(organizationInvites.status, "pending"),
        ),
        with: {
          organization: true,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitación no válida o ya fue utilizada.",
        });
      }

      if (invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta invitación ha expirado.",
        });
      }

      // Verify email matches
      if (invite.email !== ctx.session.user.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Esta invitación fue enviada a otro email. Inicia sesión con el email correcto.",
        });
      }

      // Check if already a member
      const existingMember =
        await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, invite.organizationId),
            eq(organizationMembers.userId, ctx.session.user.id),
          ),
        });

      if (existingMember) {
        // Already a member — just mark invite as accepted
        await ctx.db
          .update(organizationInvites)
          .set({
            status: "accepted",
            acceptedAt: new Date(),
          })
          .where(eq(organizationInvites.id, invite.id));

        return {
          success: true,
          organizationSlug: invite.organization.slug,
        };
      }

      // Create organization membership
      await ctx.db.insert(organizationMembers).values({
        organizationId: invite.organizationId,
        userId: ctx.session.user.id,
        role: invite.role,
        facilityIds: invite.facilityIds ?? [],
      });

      // Mark invite as accepted
      await ctx.db
        .update(organizationInvites)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(organizationInvites.id, invite.id));

      return {
        success: true,
        organizationSlug: invite.organization.slug,
      };
    }),
});
