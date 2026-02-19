import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@wifo/eslint-config/base";
import { nextjsConfig } from "@wifo/eslint-config/nextjs";
import { reactConfig } from "@wifo/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
