/**
 * Admin UI nav tests — integration mode only.
 *
 * Verifies that the expected sidebar navigation items are rendered for a
 * realm admin. Runs against the live phasetwo-ui admin console.
 *
 * Run with: PLAYWRIGHT_INTEGRATION=true pnpm test:e2e
 */

import { test, expect } from "@playwright/test";

const KC_BASE = process.env.KC_BASE_URL ?? "http://localhost:8080/auth";
const KC_REALM = process.env.KC_REALM ?? "phasetwo-ui";
const ADMIN_CONSOLE = `${KC_BASE}/admin/${KC_REALM}/console`;

test.beforeEach(async ({ page }) => {
  await page.goto(ADMIN_CONSOLE);
  // Wait for the nav sidebar to be rendered
  await page.waitForSelector(".keycloak__page_nav__nav", { timeout: 15_000 });
});

// ── Standard Keycloak nav ─────────────────────────────────────────────────────

test("Manage group is visible", async ({ page }) => {
  await expect(page.getByRole("navigation")).toContainText("Manage");
});

test("Clients nav item is visible", async ({ page }) => {
  await expect(
    page.getByTestId("nav-item-clients")
  ).toBeVisible();
});

test("Users nav item is visible", async ({ page }) => {
  await expect(page.getByTestId("nav-item-users")).toBeVisible();
});

test("Realm Roles nav item is visible", async ({ page }) => {
  await expect(page.getByTestId("nav-item-roles")).toBeVisible();
});

test("Configure group is visible", async ({ page }) => {
  await expect(page.getByRole("navigation")).toContainText("Configure");
});

test("Realm Settings nav item is visible", async ({ page }) => {
  await expect(page.getByTestId("nav-item-realm-settings")).toBeVisible();
});

test("Identity Providers nav item is visible", async ({ page }) => {
  await expect(
    page.getByTestId("nav-item-identity-providers")
  ).toBeVisible();
});

// ── Phase Two Extensions nav ──────────────────────────────────────────────────

test("Extensions group is visible", async ({ page }) => {
  await expect(page.getByRole("navigation")).toContainText("Extensions");
});

test("Organizations (ext) nav item is visible", async ({ page }) => {
  await expect(
    page.getByTestId("nav-item-ext-organizations")
  ).toBeVisible();
});

test("Styles nav item is visible", async ({ page }) => {
  await expect(page.getByTestId("nav-item-ext-styles")).toBeVisible();
});

// ── Current realm label ───────────────────────────────────────────────────────

test("current realm label shows phasetwo-ui realm", async ({ page }) => {
  await expect(page.getByTestId("currentRealm")).toContainText(/phasetwo-ui/i);
});
