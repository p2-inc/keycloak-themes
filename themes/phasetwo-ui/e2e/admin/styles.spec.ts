/**
 * Admin UI styles tests — integration mode only.
 *
 * Verifies the Styles panel in the phasetwo-ui admin console:
 *   - General styles page loads with logo/favicon fields
 *   - Login styles page loads with color pickers
 *   - Saving a primary color persists as a realm attribute
 *
 * Run with: PLAYWRIGHT_INTEGRATION=true pnpm test:e2e
 */

import { test, expect } from "@playwright/test";
import { getAdminToken } from "../helpers/api";

const KC_BASE = process.env.KC_BASE_URL ?? "http://localhost:8080/auth";
const KC_REALM = process.env.KC_REALM ?? "phasetwo-ui";
const ADMIN_CONSOLE = `${KC_BASE}/admin/${KC_REALM}/console`;

// ── General styles ────────────────────────────────────────────────────────────

test("Styles > General page loads", async ({ page }) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-styles`);
  await expect(
    page.getByRole("heading", { name: /styles|general/i })
  ).toBeVisible({ timeout: 15_000 });
});

test("General styles has logo URL field pre-filled from realm-export", async ({
  page,
}) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-styles`);

  // Navigate to the General tab if needed
  const generalTab = page.getByRole("tab", { name: /general/i });
  if (await generalTab.isVisible()) await generalTab.click();

  const logoField = page.getByLabel(/logo url/i);
  await expect(logoField).toHaveValue(
    "https://phasetwo.io/img/logo_phase_slash.svg",
    { timeout: 10_000 }
  );
});

test("General styles has favicon URL field pre-filled from realm-export", async ({
  page,
}) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-styles`);

  const generalTab = page.getByRole("tab", { name: /general/i });
  if (await generalTab.isVisible()) await generalTab.click();

  const faviconField = page.getByLabel(/favicon url/i);
  await expect(faviconField).toHaveValue(
    "https://phasetwo.io/img/favicon.svg",
    { timeout: 10_000 }
  );
});

// ── Login styles ──────────────────────────────────────────────────────────────

test("Styles > Login tab loads with color inputs", async ({ page }) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-styles`);

  await page.getByRole("tab", { name: /login/i }).click();

  // All three color fields should be present
  await expect(page.getByLabel(/primary color/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByLabel(/secondary color/i)).toBeVisible();
  await expect(page.getByLabel(/background color/i)).toBeVisible();
});

test("Login styles shows pre-filled primary color from realm-export", async ({
  page,
}) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-styles`);
  await page.getByRole("tab", { name: /login/i }).click();

  const primaryInput = page.getByLabel(/primary color/i);
  await expect(primaryInput).toHaveValue("#3b82f6", { timeout: 10_000 });
});

test("can update primary color and save", async ({ page }) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-styles`);
  await page.getByRole("tab", { name: /login/i }).click();

  const primaryInput = page.getByLabel(/primary color/i);
  await primaryInput.fill("#1d4ed8");

  await page.getByRole("button", { name: /save/i }).click();

  // Confirm success alert
  await expect(
    page.getByText(/updated|saved|success/i).first()
  ).toBeVisible({ timeout: 10_000 });

  // Verify persisted via API
  const token = await getAdminToken();
  const res = await fetch(
    `${KC_BASE}/admin/realms/${KC_REALM}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const realm = (await res.json()) as {
    attributes: Record<string, string>;
  };
  expect(
    realm.attributes["_providerConfig.assets.login.primaryColor"]
  ).toBe("#1d4ed8");

  // Restore original value
  await primaryInput.fill("#3b82f6");
  await page.getByRole("button", { name: /save/i }).click();
});

// ── Theme activation alert ────────────────────────────────────────────────────

test("activation alert references phasetwo-ui theme name", async ({
  page,
}) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-styles`);
  await page.getByRole("tab", { name: /login/i }).click();

  // The alert should tell users to activate the phasetwo-ui theme
  await expect(page.getByText(/phasetwo-ui/)).toBeVisible({ timeout: 10_000 });
  // And must NOT mention the old theme name
  await expect(page.getByText("attributes.v3")).not.toBeVisible();
});
