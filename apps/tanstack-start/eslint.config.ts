import { baseConfig, restrictEnvAccess } from "@wifo/eslint-config/base";
import { reactConfig } from "@wifo/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
