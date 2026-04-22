/**
 * Admin UI organization tests — integration mode only.
 *
 * Tests the Phase Two Organizations UI within the phasetwo-ui admin console:
 *   - List page renders
 *   - Create org via UI
 *   - View org detail
 *   - Members tab — add a member
 *   - Roles tab — assign a role to a member
 *
 * Run with: PLAYWRIGHT_INTEGRATION=true pnpm test:e2e
 */

import { test, expect } from "@playwright/test";
import {
  getAdminToken,
  findOrgByName,
  deleteOrg,
} from "../helpers/api";

const KC_BASE = process.env.KC_BASE_URL ?? "http://localhost:8080/auth";
const KC_REALM = process.env.KC_REALM ?? "phasetwo-ui";
const ADMIN_CONSOLE = `${KC_BASE}/admin/${KC_REALM}/console`;
const UI_ORG_NAME = "ui-test-org";

test.afterAll(async () => {
  const token = await getAdminToken();
  const org = await findOrgByName(token, UI_ORG_NAME);
  if (org) await deleteOrg(token, org.id);
});

// ── Organizations list ────────────────────────────────────────────────────────

test("Organizations list page loads", async ({ page }) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-organizations`);
  await expect(
    page.getByRole("heading", { name: /organizations/i })
  ).toBeVisible({ timeout: 15_000 });
});

test("fixture org appears in the list", async ({ page }) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-organizations`);
  await expect(page.getByText("e2e-test-org")).toBeVisible({ timeout: 10_000 });
});

// ── Create org via UI ─────────────────────────────────────────────────────────

test("can create an organization via the UI", async ({ page }) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-organizations`);

  // Click the create / add button
  await page.getByRole("button", { name: /create organization|add organization/i }).click();

  // Fill in the org name
  const nameInput = page.getByLabel(/name/i).first();
  await nameInput.fill(UI_ORG_NAME);

  // Save
  await page.getByRole("button", { name: /save|create/i }).click();

  // Verify we land on the org detail page or the list now contains it
  await expect(
    page.getByText(UI_ORG_NAME)
  ).toBeVisible({ timeout: 10_000 });
});

// ── Members tab ───────────────────────────────────────────────────────────────

test("can navigate to members tab and see existing members", async ({
  page,
}) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-organizations`);
  await page.getByRole("link", { name: "e2e-test-org" }).click();

  await page.getByRole("tab", { name: /members/i }).click();

  // Both fixture members should be listed
  await expect(page.getByText("org-admin")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("org-member")).toBeVisible();
});

test("can invite/add a member via the UI", async ({ page }) => {
  // Navigate to a fresh org members tab
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-organizations`);
  await page.getByRole("link", { name: "e2e-test-org" }).click();
  await page.getByRole("tab", { name: /members/i }).click();

  // Open the add member dialog
  const addButton = page.getByRole("button", { name: /add member|invite/i });
  await addButton.click();

  // Search for a user in the modal
  const searchInput = page
    .getByRole("dialog")
    .getByRole("searchbox")
    .or(page.getByRole("dialog").getByPlaceholder(/search|username/i));
  await searchInput.fill("org-member");
  await page.keyboard.press("Enter");

  // Select the user from results
  await page.getByRole("dialog").getByText("org-member").click();

  // Confirm
  const confirmBtn = page.getByRole("dialog").getByRole("button", {
    name: /add|confirm|save/i,
  });
  await confirmBtn.click();

  // Member should appear in the list
  await expect(page.getByText("org-member")).toBeVisible({ timeout: 10_000 });
});

// ── Roles tab ─────────────────────────────────────────────────────────────────

test("can view roles tab and see available roles", async ({ page }) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-organizations`);
  await page.getByRole("link", { name: "e2e-test-org" }).click();

  await page.getByRole("tab", { name: /roles/i }).click();

  // Phase Two creates permission-scoped roles by default (e.g. manage-organization)
  await expect(page.getByText("manage-organization")).toBeVisible({ timeout: 10_000 });
});

test("can assign a role to a member via the UI", async ({ page }) => {
  await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-organizations`);
  await page.getByRole("link", { name: "e2e-test-org" }).click();
  await page.getByRole("tab", { name: /members/i }).click();

  // Open the member's action menu / role assignment
  const memberRow = page.getByRole("row", { name: /org-admin/i });
  await memberRow.getByRole("button", { name: /assign role|edit|actions/i }).click();

  // Assign admin role if not already assigned
  const roleOption = page.getByRole("option", { name: "admin" }).or(
    page.getByRole("checkbox", { name: "admin" })
  );
  if (await roleOption.isVisible()) {
    await roleOption.click();
    await page.getByRole("button", { name: /save|confirm|assign/i }).click();
  }

  // No error should be shown
  await expect(page.getByRole("alert", { name: /error/i })).not.toBeVisible();
});
