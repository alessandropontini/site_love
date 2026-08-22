import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "coverage/**",
    "dist/**"
  ]),
  {
    rules: {
      // Locale and WebGL capability detection are valid external synchronizations.
      "react-hooks/set-state-in-effect": "off"
    }
  }
]);
