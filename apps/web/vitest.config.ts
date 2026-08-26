import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Real-Neon roundtrips legitimately take 4-5s under full-suite load
    // (connection-pool contention). Default 5s is too tight; 30s gives headroom
    // without masking a genuine hang (a real hang would still exceed this).
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["app/**", "lib/**", "components/**"],
    },
  },
});
