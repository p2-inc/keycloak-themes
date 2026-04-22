import { defineConfig, devices } from "@playwright/test";

/**
 * E2E test suite for the phasetwo-ui admin theme.
 *
 * TWO MODES:
 *
 * Default (api-only):
 *   pnpm test:e2e
 *   Runs pure REST API tests against the Docker Keycloak container.
 *   No browser required. Validates org CRUD, member management, role assignment.
 *
 * Integration (full browser + api):
 *   PLAYWRIGHT_INTEGRATION=true pnpm test:e2e
 *   Requires: `pnpm build && pnpm docker:start` before running.
 *   Runs auth:setup first (browser login → saves storageState).
 *   Then runs global-setup.ts (creates test fixtures via Phase Two API).
 *   Covers: nav item visibility, org UI flows, styles panel, + all API tests.
 */

const isIntegration = !!process.env.PLAYWRIGHT_INTEGRATION;

export const KC_BASE = process.env.KC_BASE_URL ?? "http://localhost:8080/auth";
export const KC_REALM = process.env.KC_REALM ?? "phasetwo-ui";
export const KC_ADMIN_URL = `${KC_BASE}/admin/${KC_REALM}/console`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: !isIntegration,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",

  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL: KC_ADMIN_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // ── Auth setup (integration only) ─────────────────────────────────────
    ...(isIntegration
      ? [
          {
            name: "auth:setup",
            testMatch: /auth\.setup\.ts/,
            use: { ...devices["Desktop Chrome"] },
          },
        ]
      : []),

    // ── API tests (always run — no browser needed) ─────────────────────────
    {
      name: "api",
      testMatch: /api\/.+\.spec\.ts/,
    },

    // ── Browser tests (integration only) ──────────────────────────────────
    ...(isIntegration
      ? [
          {
            name: "admin-ui",
            testIgnore: [/auth\.setup\.ts/, /api\/.+\.spec\.ts/],
            use: {
              ...devices["Desktop Chrome"],
              storageState: "e2e/.auth/admin.json",
            },
            dependencies: ["auth:setup"],
          },
        ]
      : []),
  ],
});
