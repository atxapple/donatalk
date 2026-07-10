import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    // Anchored `e2e/**`/`node_modules/**` only match at the repo root. Broaden to
    // `**/`-prefixed globs and exclude the whole `.claude/` tree so vitest never
    // collects Playwright specs from orphaned agent worktrees under
    // `.claude/worktrees/*/e2e/` (they throw `test.beforeAll() not expected` under
    // vitest and falsely fail the deploy test-gate).
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.claude/**"],
  },
});
