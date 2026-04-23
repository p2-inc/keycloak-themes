/**
 * Global setup — runs once before all tests.
 *
 * Creates fixture test data via the Phase Two REST API and exposes the
 * resulting IDs as environment variables for use in test files:
 *
 *   process.env.TEST_ORG_ID        — id of "e2e-test-org"
 *   process.env.TEST_ORG_ADMIN_ID  — user id of "org-admin"
 *   process.env.TEST_ORG_MEMBER_ID — user id of "org-member"
 */

import {
  getAdminToken,
  findOrgByName,
  createOrg,
  findUserId,
  addMember,
  grantOrgRole,
} from "./helpers/api";

const ORG_NAME = "e2e-test-org";

export default async function globalSetup() {
  let token: string;
  try {
    token = await getAdminToken();
  } catch (err) {
    console.warn(
      "[global-setup] Could not reach Keycloak — skipping fixture setup.",
      (err as Error).message
    );
    return;
  }

  // ── Create (or find) the test org ─────────────────────────────────────────
  let orgId: string | undefined;
  const existing = await findOrgByName(token, ORG_NAME);
  if (existing) {
    orgId = existing.id;
    console.log(`[global-setup] Reusing existing org: ${ORG_NAME} (${orgId})`);
  } else {
    orgId = await createOrg(token, ORG_NAME, "E2E Test Org");
    console.log(`[global-setup] Created org: ${ORG_NAME} (${orgId})`);
  }

  process.env.TEST_ORG_ID = orgId;

  // ── Resolve user IDs ───────────────────────────────────────────────────────
  const orgAdminId = await findUserId(token, "org-admin");
  const orgMemberId = await findUserId(token, "org-member");

  if (!orgAdminId || !orgMemberId) {
    console.warn(
      "[global-setup] org-admin or org-member user not found. " +
        "Ensure the realm-export.json was imported correctly."
    );
    return;
  }

  process.env.TEST_ORG_ADMIN_ID = orgAdminId;
  process.env.TEST_ORG_MEMBER_ID = orgMemberId;

  // ── Add members ────────────────────────────────────────────────────────────
  await addMember(token, orgId, orgAdminId).catch(() => {});
  await addMember(token, orgId, orgMemberId).catch(() => {});
  console.log(`[global-setup] Members added to ${ORG_NAME}`);

  // ── Grant org-admin role ───────────────────────────────────────────────────
  await grantOrgRole(token, orgId, orgAdminId, "manage-organization");
  console.log("[global-setup] Done.");
}
