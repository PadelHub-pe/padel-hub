import { defineConfig } from "vitest/config";

// Force tests to run under TZ=UTC. Production ships with TZ=America/Lima
// pinned at the runtime layer, but tests must prove the code is
// zone-correct independent of host TZ — a developer's machine in any
// zone should produce the same results. See docs/specs/bug-tz-lima.md.
process.env.TZ = "UTC";

export default defineConfig({
  test: {
    name: "api",
    include: ["src/**/*.test.ts"],
    env: {
      TZ: "UTC",
    },
  },
});
