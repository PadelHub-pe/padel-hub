import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@wifo/eslint-config/base";
import { reactConfig } from "@wifo/eslint-config/react";

export default defineConfig(
  {
    ignores: [".react-email/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
