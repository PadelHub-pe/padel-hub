import { baseConfig } from "@wifo/eslint-config/base";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
);
