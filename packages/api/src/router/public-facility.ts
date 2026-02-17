import { and, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod/v4";

import { courts, facilities } from "@wifo/db/schema";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const publicFacilityRouter = createTRPCRouter({
  /**
   * List active facilities with pagination and optional filters
   * Used by: /canchas directory page
   */
  list: publicProcedure
    .input(
      z.object({
        districts: z.array(z.string()).optional(),
        courtType: z.enum(["indoor", "outdoor"]).optional(),
        search: z.string().optional(),
        amenities: z.array(z.string()).optional(),
        coreOfferings: z.array(z.string()).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(facilities.isActive, true)];

      if (input.districts && input.districts.length > 0) {
        conditions.push(inArray(facilities.district, input.districts));
      }

      if (input.amenities && input.amenities.length > 0) {
        conditions.push(
          sql`${facilities.amenities} @> ${JSON.stringify(input.amenities)}::jsonb`,
        );
      }

      if (input.coreOfferings && input.coreOfferings.length > 0) {
        conditions.push(
          sql`${facilities.coreOfferings} @> ${JSON.stringify(input.coreOfferings)}::jsonb`,
        );
      }

      if (input.search) {
        conditions.push(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          or(
            ilike(facilities.name, `%${input.search}%`),
            ilike(facilities.district, `%${input.search}%`),
            ilike(facilities.address, `%${input.search}%`),
          )!,
        );
      }

      const result = await ctx.db.query.facilities.findMany({
        where: and(...conditions),
        with: {
          courts: {
            where: eq(courts.isActive, true),
            columns: {
              id: true,
              name: true,
              type: true,
              priceInCents: true,
            },
          },
        },
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          district: true,
          city: true,
          phone: true,
          amenities: true,
          coreOfferings: true,
          photos: true,
          latitude: true,
          longitude: true,
        },
        limit: input.limit,
        offset: input.offset,
        orderBy: (facilities, { asc }) => [asc(facilities.name)],
      });

      // If filtering by court type, filter in memory (simpler than join)
      let filtered = result;
      if (input.courtType) {
        filtered = result.filter((f) =>
          f.courts.some((c) => c.type === input.courtType),
        );
      }

      // Get total count for pagination
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(facilities)
        .where(and(...conditions));

      return {
        facilities: filtered,
        total: totalResult?.count ?? 0,
        hasMore: input.offset + input.limit < (totalResult?.count ?? 0),
      };
    }),

  /**
   * Get a single facility by district and slug
   * Used by: /canchas/[district]/[facility-slug] detail page
   */
  getBySlug: publicProcedure
    .input(
      z.object({
        district: z.string(),
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const facility = await ctx.db.query.facilities.findFirst({
        where: and(
          eq(facilities.slug, input.slug),
          eq(facilities.district, input.district),
          eq(facilities.isActive, true),
        ),
        with: {
          courts: {
            where: eq(courts.isActive, true),
          },
          operatingHours: true,
        },
      });

      return facility ?? null;
    }),

  /**
   * List facilities by district
   * Used by: /canchas/[district] SEO page
   */
  listByDistrict: publicProcedure
    .input(z.object({ district: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.facilities.findMany({
        where: and(
          eq(facilities.district, input.district),
          eq(facilities.isActive, true),
        ),
        with: {
          courts: {
            where: eq(courts.isActive, true),
            columns: {
              id: true,
              name: true,
              type: true,
              priceInCents: true,
            },
          },
        },
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          district: true,
          city: true,
          phone: true,
          amenities: true,
          coreOfferings: true,
          photos: true,
          latitude: true,
          longitude: true,
        },
        orderBy: (facilities, { asc }) => [asc(facilities.name)],
      });
    }),

  /**
   * Get all active districts with facility counts
   * Used by: district dropdown, sitemap generation
   */
  getDistricts: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        district: facilities.district,
        count: count(),
      })
      .from(facilities)
      .where(eq(facilities.isActive, true))
      .groupBy(facilities.district)
      .orderBy(facilities.district);

    return result;
  }),

  /**
   * Get featured facilities for homepage
   * Returns top N active facilities ordered by court count
   */
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(6) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.facilities.findMany({
        where: eq(facilities.isActive, true),
        with: {
          courts: {
            where: eq(courts.isActive, true),
            columns: {
              id: true,
              name: true,
              type: true,
              priceInCents: true,
            },
          },
        },
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          district: true,
          city: true,
          phone: true,
          amenities: true,
          coreOfferings: true,
          photos: true,
          latitude: true,
          longitude: true,
        },
        limit: input.limit,
        orderBy: (facilities, { desc }) => [desc(facilities.createdAt)],
      });
    }),
});
