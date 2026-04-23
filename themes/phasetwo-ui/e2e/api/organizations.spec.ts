/**
 * API-level organization tests.
 * These run in both modes (default + integration) — no browser required.
 * They test the Phase Two REST API directly against the Docker container.
 *
 * Run with: pnpm test:e2e
 */

import { test, expect } from "@playwright/test";
import {
  getAdminToken,
  listOrgs,
  getOrg,
  getOrgCount,
  createOrg,
  updateOrg,
  deleteOrg,
  findOrgByName,
  findUserId,
  listMembers,
  getMemberCount,
  checkMembership,
  addMember,
  removeMember,
  getMemberAttributes,
  setMemberAttributes,
  getUserOrgs,
  listOrgRoles,
  getOrgRole,
  createOrgRole,
  updateOrgRole,
  deleteOrgRole,
  getUsersWithRole,
  checkUserHasRole,
  grantOrgRole,
  revokeOrgRole,
  listMemberRoles,
  createInvitation,
  listInvitations,
  getInvitationCount,
  deleteInvitation,
} from "../helpers/api";

const TEMP_ORG = "api-test-temp-org";

let token: string;

test.beforeAll(async () => {
  token = await getAdminToken();
});

// ── Fixture verification ──────────────────────────────────────────────────────

test("fixture org exists after global-setup", async () => {
  const org = await findOrgByName(token, "e2e-test-org");
  expect(org).toBeDefined();
  expect(org!.name).toBe("e2e-test-org");
});

test("fixture members are in the test org", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const members = await listMembers(token, orgId);
  const usernames = members.map((m) => m.username);
  expect(usernames).toContain("org-admin");
  expect(usernames).toContain("org-member");
});

test("org-admin has manage-organization role in fixture org", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const orgAdminId = process.env.TEST_ORG_ADMIN_ID!;
  const roles = await listMemberRoles(token, orgId, orgAdminId);
  expect(roles.map((r) => r.name)).toContain("manage-organization");
});

// ── Org list & read ───────────────────────────────────────────────────────────

test("org list returns an array", async () => {
  const orgs = await listOrgs(token);
  expect(Array.isArray(orgs)).toBe(true);
});

test("org count matches list length", async () => {
  const [orgs, count] = await Promise.all([
    listOrgs(token),
    getOrgCount(token),
  ]);
  expect(count).toBe(orgs.length);
});

test("org list supports search filter", async () => {
  const orgs = await listOrgs(token, { search: "e2e-test-org" });
  expect(orgs.every((o) => o.name.includes("e2e"))).toBe(true);
});

test("org list supports pagination", async () => {
  const page1 = await listOrgs(token, { first: 0, max: 1 });
  expect(page1.length).toBeLessThanOrEqual(1);
});

test("can get org by id", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const org = await getOrg(token, orgId);
  expect(org.id).toBe(orgId);
  expect(org.name).toBe("e2e-test-org");
});

// ── Roles — read ─────────────────────────────────────────────────────────────

test("fixture org has default Phase Two roles", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const roles = await listOrgRoles(token, orgId);
  const names = roles.map((r) => r.name);
  // Phase Two default permission-scoped roles
  expect(names).toContain("manage-organization");
  expect(names).toContain("view-members");
  expect(names).toContain("manage-members");
  expect(names).toContain("view-roles");
});

test("can get a role by name", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const role = await getOrgRole(token, orgId, "manage-organization");
  expect(role.name).toBe("manage-organization");
  expect(role.description).toBeTruthy();
});

test("can list users who have a specific role", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const orgAdminId = process.env.TEST_ORG_ADMIN_ID!;
  const users = await getUsersWithRole(token, orgId, "manage-organization");
  const ids = users.map((u) => u.id);
  expect(ids).toContain(orgAdminId);
});

test("can check whether a user has a role", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const orgAdminId = process.env.TEST_ORG_ADMIN_ID!;
  const orgMemberId = process.env.TEST_ORG_MEMBER_ID!;
  expect(await checkUserHasRole(token, orgId, "manage-organization", orgAdminId)).toBe(true);
  expect(await checkUserHasRole(token, orgId, "manage-organization", orgMemberId)).toBe(false);
});

// ── Members — read ────────────────────────────────────────────────────────────

test("member count matches member list length", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const [members, count] = await Promise.all([
    listMembers(token, orgId),
    getMemberCount(token, orgId),
  ]);
  expect(count).toBe(members.length);
});

test("can check membership status", async () => {
  const orgId = process.env.TEST_ORG_ID!;
  const orgAdminId = process.env.TEST_ORG_ADMIN_ID!;
  expect(await checkMembership(token, orgId, orgAdminId)).toBe(true);
});

test("non-member returns false for membership check", async () => {
  // Use a non-existent user id — should 404
  const orgId = process.env.TEST_ORG_ID!;
  expect(await checkMembership(token, orgId, "00000000-0000-0000-0000-000000000000")).toBe(false);
});

// ── User ↔ org queries ────────────────────────────────────────────────────────

test("can query which orgs a user belongs to", async () => {
  const orgAdminId = process.env.TEST_ORG_ADMIN_ID!;
  const orgId = process.env.TEST_ORG_ID!;
  const orgs = await getUserOrgs(token, orgAdminId);
  expect(Array.isArray(orgs)).toBe(true);
  expect(orgs.map((o) => o.id)).toContain(orgId);
});

// ── CRUD — org lifecycle (serial) ────────────────────────────────────────────

test.describe.serial("org lifecycle", () => {
  let orgId: string;

  test.afterAll(async () => {
    const org = await findOrgByName(token, TEMP_ORG);
    if (org) await deleteOrg(token, org.id);
  });

  test("can create an organization", async () => {
    orgId = await createOrg(token, TEMP_ORG, "API Test Org", {
      department: ["engineering"],
    });
    expect(orgId).toBeTruthy();
    const org = await getOrg(token, orgId);
    expect(org.name).toBe(TEMP_ORG);
    expect(org.displayName).toBe("API Test Org");
  });

  test("can update org display name and attributes", async () => {
    await updateOrg(token, orgId, {
      name: TEMP_ORG,
      displayName: "API Test Org (updated)",
      attributes: { tier: ["premium"] },
    });
    const updated = await getOrg(token, orgId);
    expect(updated.displayName).toBe("API Test Org (updated)");
  });

  test("can add a member", async () => {
    const userId = await findUserId(token, "org-member");
    expect(userId).toBeTruthy();
    await addMember(token, orgId, userId!);
    expect(await checkMembership(token, orgId, userId!)).toBe(true);
  });

  test("member count reflects added member", async () => {
    const count = await getMemberCount(token, orgId);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("can set and read member attributes", async () => {
    const userId = await findUserId(token, "org-member");
    await setMemberAttributes(token, orgId, userId!, { team: ["backend"] });
    const attrs = await getMemberAttributes(token, orgId, userId!);
    expect(attrs.team).toContain("backend");
  });

  test("can remove a member", async () => {
    const userId = await findUserId(token, "org-member");
    await removeMember(token, orgId, userId!);
    expect(await checkMembership(token, orgId, userId!)).toBe(false);
  });

  test("can delete the organization", async () => {
    await deleteOrg(token, orgId);
    const gone = await findOrgByName(token, TEMP_ORG);
    expect(gone).toBeUndefined();
  });
});

// ── Role lifecycle (serial) ───────────────────────────────────────────────────

test.describe.serial("custom role lifecycle", () => {
  const ROLE_ORG = "api-test-role-org";
  const ROLE_NAME = "api-test-editor";
  let roleOrgId: string;

  test.beforeAll(async () => {
    roleOrgId = await createOrg(token, ROLE_ORG);
    const userId = await findUserId(token, "org-member");
    if (userId) await addMember(token, roleOrgId, userId);
  });

  test.afterAll(async () => {
    const org = await findOrgByName(token, ROLE_ORG);
    if (org) await deleteOrg(token, org.id);
  });

  test("can create a custom role", async () => {
    await createOrgRole(token, roleOrgId, {
      name: ROLE_NAME,
      description: "Can edit org content",
    });
    const roles = await listOrgRoles(token, roleOrgId);
    expect(roles.map((r) => r.name)).toContain(ROLE_NAME);
  });

  test("can update a custom role description", async () => {
    await updateOrgRole(token, roleOrgId, ROLE_NAME, {
      name: ROLE_NAME,
      description: "Can edit and publish org content",
    });
    const role = await getOrgRole(token, roleOrgId, ROLE_NAME);
    expect(role.description).toBe("Can edit and publish org content");
  });

  test("can grant a custom role to a member", async () => {
    const userId = await findUserId(token, "org-member");
    await grantOrgRole(token, roleOrgId, userId!, ROLE_NAME);
    expect(await checkUserHasRole(token, roleOrgId, ROLE_NAME, userId!)).toBe(true);
  });

  test("granted role appears in member role list", async () => {
    const userId = await findUserId(token, "org-member");
    const roles = await listMemberRoles(token, roleOrgId, userId!);
    expect(roles.map((r) => r.name)).toContain(ROLE_NAME);
  });

  test("role appears in users-with-role list", async () => {
    const userId = await findUserId(token, "org-member");
    const users = await getUsersWithRole(token, roleOrgId, ROLE_NAME);
    expect(users.map((u) => u.id)).toContain(userId);
  });

  test("can revoke a custom role from a member", async () => {
    const userId = await findUserId(token, "org-member");
    await revokeOrgRole(token, roleOrgId, userId!, ROLE_NAME);
    expect(await checkUserHasRole(token, roleOrgId, ROLE_NAME, userId!)).toBe(false);
  });

  test("can delete a custom role", async () => {
    await deleteOrgRole(token, roleOrgId, ROLE_NAME);
    const roles = await listOrgRoles(token, roleOrgId);
    expect(roles.map((r) => r.name)).not.toContain(ROLE_NAME);
  });
});

// ── Invitations (serial) ──────────────────────────────────────────────────────

test.describe.serial("invitation lifecycle", () => {
  const INV_ORG = "api-test-inv-org";
  let invOrgId: string;
  let invitationId: string;

  test.beforeAll(async () => {
    invOrgId = await createOrg(token, INV_ORG);
  });

  test.afterAll(async () => {
    const org = await findOrgByName(token, INV_ORG);
    if (org) await deleteOrg(token, org.id);
  });

  test("invitation count starts at zero", async () => {
    const count = await getInvitationCount(token, invOrgId);
    expect(count).toBe(0);
  });

  test("can create an invitation", async () => {
    invitationId = await createInvitation(
      token,
      invOrgId,
      "invite-test@example.com",
      { send: false }
    );
    expect(invitationId).toBeTruthy();
  });

  test("invitation appears in list", async () => {
    const invitations = await listInvitations(token, invOrgId);
    expect(invitations.map((i) => i.id)).toContain(invitationId);
  });

  test("invitation count increments", async () => {
    const count = await getInvitationCount(token, invOrgId);
    expect(count).toBe(1);
  });

  test("can delete an invitation", async () => {
    await deleteInvitation(token, invOrgId, invitationId);
    const remaining = await listInvitations(token, invOrgId);
    expect(remaining.map((i) => i.id)).not.toContain(invitationId);
  });
});
