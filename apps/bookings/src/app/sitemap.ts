import type { MetadataRoute } from "next";

import { db } from "@wifo/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const activeFacilities = await db.query.facilities.findMany({
    where: (f, { eq }) => eq(f.isActive, true),
    columns: { slug: true, updatedAt: true },
  });

  return activeFacilities.map((f) => ({
    url: `https://bookings.padelhub.pe/${f.slug}`,
    lastModified: f.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));
}
