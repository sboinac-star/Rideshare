import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    exclude: ["node_modules", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**", "src/features/**"],
      exclude: [
        "src/lib/firebase.ts",         // config adapter, no logic to test
        "src/lib/adminFirebase.ts",    // firebase-admin wrappers, server-only, no unit tests
        "src/lib/notifications.ts",    // browser push APIs (service worker, Notification), not testable in jsdom
        "src/lib/firestore.ts",        // pure data-mapping helpers tested indirectly
        "src/lib/constants.ts",        // static data, no logic
        "src/lib/validation.ts",       // pre-existing utilities, tracked separately
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
