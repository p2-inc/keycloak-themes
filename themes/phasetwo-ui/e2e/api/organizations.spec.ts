/**
 * API-level organization tests.
 * These run in both modes (default + integration) — no browser required.
 * They test the Phase Two REST API directly against the Docker container.
 */

import { test, expect } from "@playwright/test";
import {
  getAdminToken,
  listOrgs,
  createOrg,
  deleteOrg,
  findOrgByName,
  findUserId,
  listMembers,
  addMember,
  removeMember,
  listOrgRoles,
  grantOrgRole,
  listMemberRoles,
} from "../helpers/api";

const TEMP_ORG = "api-test-temp-org";

let token: string;

test.beforeAll(async () => {
  token = await getAdminToken();
});

// ── Fixture data ──────────────────────────────────────────────────────────────

test("fixture org exists after global-setup", async () => {
  const org = await findOrgByName(token, "e2e-test-org");
  expect(org).toBeDefined();
  expect(org!.name).toBe("e2e-test-org");
});

test("fixture members are in the test org", async () => {
  const orgId = process.env.TEST_ORG_ID;
  expect(orgId).toBeTruthy();

  const members = await listMembers(token, orgId!);
  const usernames = members.map((m) => m.username);
  expect(usernames).toContain("org-admin");
  expect(usernames).toContain("org-member");
});

test("org-admin has manage-organization role in fixture org", async () => {
  const orgId = process.env.TEST_ORG_ID;
  const orgAdminId = process.env.TEST_ORG_ADMIN_ID;
  expect(orgId).toBeTruthy();
  expect(orgAdminId).toBeTruthy();

  const roles = await listMemberRoles(token, orgId!, orgAdminId!);
  const roleNames = roles.map((r) => r.name);
  expect(roleNames).toContain("manage-organization");
});

test("can list org roles", async () => {
  const orgId = process.env.TEST_ORG_ID;
  expect(orgId).toBeTruthy();

  const roles = await listOrgRoles(token, orgId!);
  expect(Array.isArray(roles)).toBe(true);
  expect(roles.length).toBeGreaterThan(0);
});

test("can grant and verify a role", async () => {
  const orgId = process.env.TEST_ORG_ID;
  const memberId = process.env.TEST_ORG_MEMBER_ID;
  expect(orgId).toBeTruthy();
  expect(memberId).toBeTruthy();

  // Add member first (may already be present from global-setup)
  await addMember(token, orgId!, memberId!).catch(() => {});

  const roles = await listOrgRoles(token, orgId!);
  const nonAdminRole = roles[0];
  if (!nonAdminRole) {
    test.skip(true, "No roles found in fixture org");
    return;
  }

  await grantOrgRole(token, orgId!, memberId!, nonAdminRole.name);

  const memberRoles = await listMemberRoles(token, orgId!, memberId!);
  expect(memberRoles.map((r) => r.name)).toContain(nonAdminRole.name);
});

test("org list returns an array", async () => {
  const orgs = await listOrgs(token);
  expect(Array.isArray(orgs)).toBe(true);
});

// ── CRUD (serial — tests share tempOrgId state) ───────────────────────────────

test.describe.serial("org CRUD", () => {
  let tempOrgId: string;

  test.afterAll(async () => {
    const org = await findOrgByName(token, TEMP_ORG);
    if (org) await deleteOrg(token, org.id);
  });

  test("can create an organization", async () => {
    tempOrgId = await createOrg(token, TEMP_ORG, "API Test Temp Org");
    expect(tempOrgId).toBeTruthy();

    const org = await findOrgByName(token, TEMP_ORG);
    expect(org).toBeDefined();
    expect(org!.name).toBe(TEMP_ORG);
  });

  test("can add a member to an organization", async () => {
    const userId = await findUserId(token, "org-member");
    expect(userId).toBeTruthy();

    await addMember(token, tempOrgId, userId!);

    const members = await listMembers(token, tempOrgId);
    expect(members.map((m) => m.username)).toContain("org-member");
  });

  test("can remove a member from an organization", async () => {
    const userId = await findUserId(token, "org-member");
    expect(userId).toBeTruthy();

    await removeMember(token, tempOrgId, userId!);

    const members = await listMembers(token, tempOrgId);
    expect(members.map((m) => m.username)).not.toContain("org-member");
  });
});
