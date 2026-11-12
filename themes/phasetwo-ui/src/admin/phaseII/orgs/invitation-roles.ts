/**
 * Which org roles the current admin may attach to an invitation.
 *
 * Mirrors the server rules from p2-inc/keycloak-orgs#517:
 *
 *   - `manage-organizations` on the realm-management client: any org role.
 *   - otherwise the org `manage-roles` role is needed, and only the roles the
 *     user holds in that org can be attached.
 *   - an invitation with no roles only needs `manage-invitations`.
 *
 * The server answers `401` to a request that breaks these rules. The UI only
 * offers what the server would accept, so an empty result means "hide the
 * role picker", not "the user cannot invite".
 */

export const ORG_MANAGE_ROLES = "manage-roles";

export type InvitableRole = { name: string; description?: string };

export type InvitationRoleSources = {
  /** The admin has realm-management `manage-organizations`. */
  canManageOrganizations: boolean;
  /**
   * The admin's own user ID, when it is a user of the realm being managed.
   * An admin signed in to another realm (e.g. master) is never an org member
   * here, so the org-level rules cannot grant them anything.
   */
  currentUserId?: string;
  /** All roles defined in the org. */
  listOrgRoles: () => Promise<{ name?: string; description?: string }[]>;
  /** The roles the given user holds in the org. */
  listUserOrgRoles: (
    userId: string,
  ) => Promise<{ name?: string; description?: string }[]>;
};

const toInvitable = (roles: { name?: string; description?: string }[]) =>
  roles
    .filter((r): r is InvitableRole => !!r.name)
    .map(({ name, description }) => ({ name, description }))
    .sort((a, b) => a.name.localeCompare(b.name));

export async function getInvitableRoles({
  canManageOrganizations,
  currentUserId,
  listOrgRoles,
  listUserOrgRoles,
}: InvitationRoleSources): Promise<InvitableRole[]> {
  if (canManageOrganizations) {
    return toInvitable(await listOrgRoles());
  }

  if (!currentUserId) return [];

  const held = await listUserOrgRoles(currentUserId);
  if (!held.some((r) => r.name === ORG_MANAGE_ROLES)) return [];

  return toInvitable(held);
}
