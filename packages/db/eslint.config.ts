import { defineConfig } from "eslint/config";

import { baseConfig } from "@wifo/eslint-config/base";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
);
