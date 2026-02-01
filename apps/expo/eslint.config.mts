import { baseConfig } from "@wifo/eslint-config/base";
import { reactConfig } from "@wifo/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
