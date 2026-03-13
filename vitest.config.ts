import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.tsx"],
    coverage: {
      provider: "istanbul",
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts", "**/node_modules/**"],
    },
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "e2e", "test-results", "playwright-report"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
