import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    // `dist/` holds compiled output that includes compiled specs; running those
    // through vitest fails because they are CommonJS.
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});