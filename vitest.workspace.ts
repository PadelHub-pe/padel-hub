import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/api/vitest.config.ts",
  "packages/images/vitest.config.ts",
  "packages/validators/vitest.config.ts",
]);
