/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- mock DB passed as any */
/* eslint-disable @typescript-eslint/no-unsafe-return -- mock DB returns */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock DB types */
import { describe, expect, it, vi } from "vitest";

import {
  generateUniqueFacilitySlug,
  generateUniqueOrgSlug,
  slugify,
} from "../lib/slugify";

// ---------------------------------------------------------------------------
// slugify() — pure function tests
// ---------------------------------------------------------------------------

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Trigal Padel")).toBe("trigal-padel");
  });

  it("strips accents", () => {
    expect(slugify("Café Miraflores")).toBe("cafe-miraflores");
    expect(slugify("Estación San Martín")).toBe("estacion-san-martin");
  });

  it("replaces special characters with hyphens", () => {
    expect(slugify("Club & Sports!")).toBe("club-sports");
  });

  it("collapses multiple spaces/hyphens into single hyphen", () => {
    expect(slugify("Padel   Club   Lima")).toBe("padel-club-lima");
    expect(slugify("Padel---Club")).toBe("padel-club");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  Padel Club  ")).toBe("padel-club");
    expect(slugify("---padel---")).toBe("padel");
  });

  it("handles ñ correctly", () => {
    expect(slugify("Año Nuevo")).toBe("ano-nuevo");
  });

  it("handles numbers", () => {
    expect(slugify("Club Padel 2024")).toBe("club-padel-2024");
  });

  it("handles all-special-char input", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// generateUniqueFacilitySlug() — with mock DB
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000001";

describe("generateUniqueFacilitySlug", () => {
  it("returns base slug when no collision", async () => {
    const db = buildSimpleMockDb([]);
    const slug = await generateUniqueFacilitySlug(db, ORG_ID, "Trigal Padel");
    expect(slug).toBe("trigal-padel");
  });

  it("appends -2 on first collision", async () => {
    const db = buildSimpleMockDb(["trigal-padel"]);
    const slug = await generateUniqueFacilitySlug(db, ORG_ID, "Trigal Padel");
    expect(slug).toBe("trigal-padel-2");
  });

  it("appends -3 when -2 is also taken", async () => {
    const db = buildSimpleMockDb(["trigal-padel", "trigal-padel-2"]);
    const slug = await generateUniqueFacilitySlug(db, ORG_ID, "Trigal Padel");
    expect(slug).toBe("trigal-padel-3");
  });

  it("handles accented names with collisions", async () => {
    const db = buildSimpleMockDb(["cafe-miraflores"]);
    const slug = await generateUniqueFacilitySlug(
      db,
      ORG_ID,
      "Café Miraflores",
    );
    expect(slug).toBe("cafe-miraflores-2");
  });
});

// ---------------------------------------------------------------------------
// generateUniqueOrgSlug() — with mock DB
// ---------------------------------------------------------------------------

describe("generateUniqueOrgSlug", () => {
  it("returns base slug when no collision", async () => {
    const db = buildSimpleOrgMockDb([]);
    const slug = await generateUniqueOrgSlug(db, "Padel Group Lima");
    expect(slug).toBe("padel-group-lima");
  });

  it("deduplicates with -2 suffix", async () => {
    const db = buildSimpleOrgMockDb(["padel-group-lima"]);
    const slug = await generateUniqueOrgSlug(db, "Padel Group Lima");
    expect(slug).toBe("padel-group-lima-2");
  });
});

// ---------------------------------------------------------------------------
// Simple mock DB helpers — use findFirst callback to inspect slug candidates
// ---------------------------------------------------------------------------

function buildSimpleMockDb(existingSlugs: string[]) {
  let callIndex = 0;
  return {
    query: {
      facilities: {
        findFirst: vi.fn().mockImplementation(() => {
          // We know generateUniqueFacilitySlug calls in order:
          // attempt 0 → base, attempt 1 → base-2, attempt 2 → base-3, ...
          // So we just check by call order
          const idx = callIndex++;
          // We need the base slug from the first call.
          // Since we can't extract it from drizzle where clauses,
          // we use a simpler approach: check if idx < existingSlugs.length
          if (idx < existingSlugs.length) {
            return Promise.resolve({ id: "existing-id" });
          }
          return Promise.resolve(undefined);
        }),
      },
    },
  } as any;
}

function buildSimpleOrgMockDb(existingSlugs: string[]) {
  let callIndex = 0;
  return {
    query: {
      organizations: {
        findFirst: vi.fn().mockImplementation(() => {
          const idx = callIndex++;
          if (idx < existingSlugs.length) {
            return Promise.resolve({ id: "existing-id" });
          }
          return Promise.resolve(undefined);
        }),
      },
    },
  } as any;
}
