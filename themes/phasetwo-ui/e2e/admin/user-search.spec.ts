/**
 * Admin UI user search tests — integration mode only.
 *
 * Covers the exact-match user lookup that replaces Keycloak's Default and
 * Attribute search modes:
 *   - Users page: auto-detected username and email lookups, attribute filter
 *     chips, removing filters
 *   - Group members: Add member modal
 *   - Organization members: Add member modal
 *
 * Fixtures come from helpers/user-lookup-fixtures.ts (created in global-setup).
 *
 * Run with: PLAYWRIGHT_INTEGRATION=true pnpm test:e2e
 */

import { test, expect, type Page } from "@playwright/test";
import {
  findOrgByName,
  findUserId,
  getAdminToken,
  removeMember,
} from "../helpers/api";
import {
  LOOKUP_ADA,
  LOOKUP_ADAM,
  LOOKUP_ATTRIBUTE,
  LOOKUP_GROUP,
} from "../helpers/user-lookup-fixtures";

const KC_BASE = process.env.KC_BASE_URL ?? "http://localhost:8080/auth";
const KC_REALM = process.env.KC_REALM ?? "phasetwo-ui";
const ADMIN_CONSOLE = `${KC_BASE}/admin/${KC_REALM}/console`;

const lookupValue = (page: Page) => page.getByTestId("user-lookup-value");

const lookUp = async (page: Page, value: string) => {
  await lookupValue(page).fill(value);
  await lookupValue(page).press("Enter");
};

// ── Users page ────────────────────────────────────────────────────────────────

test.describe("Users page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/users`);
    await expect(lookupValue(page)).toBeVisible({ timeout: 15_000 });
  });

  test("replaces the Default/Attribute search modes", async ({ page }) => {
    await expect(page.getByTestId("user-search-toggle")).toHaveCount(0);
    await expect(page.getByTestId("table-search-input")).toHaveCount(0);
    await expect(page.getByTestId("user-lookup-field")).toHaveText(/auto-detect/i);
  });

  test("an exact username matches only that user", async ({ page }) => {
    await lookUp(page, LOOKUP_ADA.username.toUpperCase());

    const chips = page.getByTestId("user-lookup-chips");
    await expect(chips).toContainText("Username");
    await expect(chips).toContainText(LOOKUP_ADA.username.toUpperCase());
    await expect(page.getByRole("link", { name: LOOKUP_ADA.username })).toBeVisible();
    await expect(page.getByRole("link", { name: LOOKUP_ADAM.username })).toHaveCount(0);
  });

  test("a partial username matches nothing", async ({ page }) => {
    await lookUp(page, "lookup-ad");
    await expect(page.getByRole("link", { name: LOOKUP_ADA.username })).toHaveCount(0);
    await expect(page.getByRole("link", { name: LOOKUP_ADAM.username })).toHaveCount(0);
  });

  test("a value with @ is looked up as an email", async ({ page }) => {
    await lookUp(page, LOOKUP_ADAM.email);
    await expect(page.getByTestId("user-lookup-chips")).toContainText("Email");
    await expect(page.getByRole("link", { name: LOOKUP_ADAM.username })).toBeVisible();
  });

  test("attribute filters combine with username filters", async ({ page }) => {
    await page.getByTestId("user-lookup-field").click();
    await page.getByTestId(`user-lookup-attribute-${LOOKUP_ATTRIBUTE.name}`).click();
    await lookUp(page, "lg 10401");

    const chips = page.getByTestId("user-lookup-chips");
    await expect(chips).toContainText(LOOKUP_ATTRIBUTE.displayName);
    await expect(page.getByRole("link", { name: LOOKUP_ADA.username })).toBeVisible();

    // Same attribute plus a different user's username: AND matches nobody.
    await page.getByTestId("user-lookup-field").click();
    await page.getByRole("menuitem", { name: /^username$/i }).click();
    await lookUp(page, LOOKUP_ADAM.username);
    await expect(page.getByRole("link", { name: LOOKUP_ADA.username })).toHaveCount(0);

    // Removing the username chip brings the attribute match back.
    await chips
      .getByRole("group", { name: /username/i })
      .getByRole("button", { name: /remove filter/i })
      .click();
    await expect(page.getByRole("link", { name: LOOKUP_ADA.username })).toBeVisible();

    // With one filter left, its own close button clears the search.
    await chips.getByRole("button", { name: /remove filter/i }).click();
    await expect(chips).toHaveCount(0);
  });
});

// ── Group members ─────────────────────────────────────────────────────────────

test.describe("Group Add member modal", () => {
  test.afterAll(async () => {
    const token = await getAdminToken();
    const userId = await findUserId(token, LOOKUP_ADA.username);
    const groups = await fetch(
      `${KC_BASE}/admin/realms/${KC_REALM}/users/${userId}/groups`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).then((r) => r.json() as Promise<Array<{ id: string; name: string }>>);
    const group = groups.find((g) => g.name === LOOKUP_GROUP);
    if (group) {
      await fetch(
        `${KC_BASE}/admin/realms/${KC_REALM}/users/${userId}/groups/${group.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
    }
  });

  test("adds a user found by exact username", async ({ page }) => {
    await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/groups`);
    await page.getByRole("link", { name: LOOKUP_GROUP }).click();
    await page.getByRole("tab", { name: /members/i }).click();
    await page.getByRole("button", { name: /add member/i }).first().click();

    const dialog = page.getByRole("dialog");
    // Nothing is listed until a user is looked up.
    await expect(dialog.getByTestId("empty-state")).toBeVisible();
    await expect(dialog.getByRole("row")).toHaveCount(0);

    await dialog.getByTestId("user-lookup-value").fill(LOOKUP_ADA.username);
    await dialog.getByTestId("user-lookup-value").press("Enter");
    await expect(dialog.getByText(LOOKUP_ADA.username)).toBeVisible();
    await expect(dialog.getByText(LOOKUP_ADAM.username)).toHaveCount(0);

    await dialog.getByRole("row", { name: new RegExp(LOOKUP_ADA.username) })
      .getByRole("checkbox")
      .check();
    await dialog.getByTestId("add").click();

    await expect(
      page.getByRole("link", { name: LOOKUP_ADA.username }).or(
        page.getByText(LOOKUP_ADA.username)
      ).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ── Organization members ──────────────────────────────────────────────────────

test.describe("Organization Add member modal", () => {
  test.afterAll(async () => {
    const token = await getAdminToken();
    const org = await findOrgByName(token, "e2e-test-org");
    const userId = await findUserId(token, LOOKUP_ADAM.username);
    if (org && userId) await removeMember(token, org.id, userId).catch(() => {});
  });

  test("hides existing members and adds a user found by email", async ({
    page,
  }) => {
    await page.goto(`${ADMIN_CONSOLE}/#/${KC_REALM}/ext-organizations`);
    await page.getByRole("link", { name: "e2e-test-org" }).click();
    await page.getByRole("tab", { name: /members/i }).click();
    await page.getByRole("button", { name: /add member/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByTestId("empty-state")).toBeVisible();

    // org-member is already in the org, so the lookup finds nobody to add.
    await dialog.getByTestId("user-lookup-value").fill("org-member");
    await dialog.getByTestId("user-lookup-value").press("Enter");
    await expect(dialog.getByRole("row", { name: /org-member/ })).toHaveCount(0);

    await dialog.getByTestId("user-lookup-value").fill(LOOKUP_ADAM.email);
    await dialog.getByTestId("user-lookup-value").press("Enter");
    await dialog.getByRole("row", { name: new RegExp(LOOKUP_ADAM.username) })
      .getByRole("checkbox")
      .check();
    await dialog.getByTestId("add").click();

    await expect(page.getByText(LOOKUP_ADAM.username)).toBeVisible({
      timeout: 10_000,
    });
  });
});
