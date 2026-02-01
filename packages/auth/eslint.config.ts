import { baseConfig, restrictEnvAccess } from "@wifo/eslint-config/base";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: ["script/**"],
  },
  baseConfig,
  restrictEnvAccess,
);
