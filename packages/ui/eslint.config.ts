import { defineConfig } from "eslint/config";

import { baseConfig } from "@wifo/eslint-config/base";
import { reactConfig } from "@wifo/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
