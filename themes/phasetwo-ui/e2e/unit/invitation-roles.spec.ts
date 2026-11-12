/**
 * Unit tests for the invitation role picker's access rules.
 * Pure functions — no browser and no Keycloak needed.
 *
 * Run with: pnpm test:e2e --project unit
 */

import { test, expect } from "@playwright/test";
import { getInvitableRoles } from "../../src/admin/phaseII/orgs/invitation-roles";

const ORG_ROLES = [
  { name: "view-members" },
  { name: "manage-roles" },
  { name: "billing", description: "Billing admin" },
  { name: "manage-members" },
];

const names = (roles: { name: string }[]) => roles.map((r) => r.name);

function sources(overrides: {
  canManageOrganizations?: boolean;
  currentUserId?: string;
  userRoles?: { name?: string }[];
}) {
  const calls = { listOrgRoles: 0, listUserOrgRoles: [] as string[] };
  return {
    calls,
    args: {
      canManageOrganizations: overrides.canManageOrganizations ?? false,
      currentUserId: overrides.currentUserId,
      listOrgRoles: async () => {
        calls.listOrgRoles++;
        return ORG_ROLES;
      },
      listUserOrgRoles: async (userId: string) => {
        calls.listUserOrgRoles.push(userId);
        return overrides.userRoles ?? [];
      },
    },
  };
}

test.describe("getInvitableRoles", () => {
  test("realm manage-organizations offers every org role", async () => {
    const { args, calls } = sources({
      canManageOrganizations: true,
      currentUserId: "u1",
      userRoles: [],
    });
    const roles = await getInvitableRoles(args);
    expect(names(roles)).toEqual([
      "billing",
      "manage-members",
      "manage-roles",
      "view-members",
    ]);
    expect(roles.find((r) => r.name === "billing")?.description).toBe(
      "Billing admin",
    );
    expect(calls.listUserOrgRoles).toEqual([]);
  });

  test("org manage-roles offers only the roles the user holds", async () => {
    const { args, calls } = sources({
      currentUserId: "u1",
      userRoles: [{ name: "view-members" }, { name: "manage-roles" }],
    });
    const roles = await getInvitableRoles(args);
    expect(names(roles)).toEqual(["manage-roles", "view-members"]);
    expect(calls.listOrgRoles).toBe(0);
    expect(calls.listUserOrgRoles).toEqual(["u1"]);
  });

  test("without org manage-roles nothing is offered", async () => {
    const { args } = sources({
      currentUserId: "u1",
      userRoles: [{ name: "view-members" }, { name: "manage-invitations" }],
    });
    expect(await getInvitableRoles(args)).toEqual([]);
  });

  test("an admin from another realm (no local user) gets nothing", async () => {
    const { args, calls } = sources({ currentUserId: undefined });
    expect(await getInvitableRoles(args)).toEqual([]);
    expect(calls.listOrgRoles).toBe(0);
    expect(calls.listUserOrgRoles).toEqual([]);
  });

  test("roles without a name are dropped", async () => {
    const { args } = sources({
      currentUserId: "u1",
      userRoles: [{ name: "manage-roles" }, {}],
    });
    expect(names(await getInvitableRoles(args))).toEqual(["manage-roles"]);
  });
});
