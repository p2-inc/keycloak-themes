/**
 * Auth setup — runs before browser tests in integration mode.
 * Logs in to the Keycloak admin console and saves the browser storage state
 * so subsequent tests start already authenticated.
 *
 * Run as part of: PLAYWRIGHT_INTEGRATION=true pnpm test:e2e
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AUTH_FILE = path.join(__dirname, ".auth/admin.json");

const KC_BASE = process.env.KC_BASE_URL ?? "http://localhost:8080/auth";
const KC_REALM = process.env.KC_REALM ?? "phasetwo-ui";

setup("authenticate as realm admin", async ({ page }) => {
  // Keycloak admin console authenticates through the master realm regardless
  // of which realm you are managing.
  await page.goto(`${KC_BASE}/admin/${KC_REALM}/console`);

  // KC redirects to the master realm login page
  await page.getByLabel("Username or email").fill(
    process.env.KC_ADMIN ?? "admin"
  );
  await page.getByLabel("Password", { exact: true }).fill(
    process.env.KC_ADMIN_PASSWORD ?? "admin"
  );
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait until we land on the admin console for the phasetwo-ui realm
  await expect(page).toHaveURL(new RegExp(`/admin/${KC_REALM}/console`), {
    timeout: 15_000,
  });

  await page.context().storageState({ path: AUTH_FILE });
});
