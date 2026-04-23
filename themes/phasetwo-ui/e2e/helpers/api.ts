/**
 * Keycloak + Phase Two Admin REST API helpers.
 * Used by global-setup, api specs, and browser test fixtures.
 */

export const KC_BASE = process.env.KC_BASE_URL ?? "http://localhost:8080/auth";
export const KC_REALM = process.env.KC_REALM ?? "phasetwo-ui";

const typed = <T>(res: Response): Promise<T> => res.json() as Promise<T>;

export async function getAdminToken(): Promise<string> {
  const res = await fetch(
    `${KC_BASE}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "admin-cli",
        grant_type: "password",
        username: process.env.KC_ADMIN ?? "admin",
        password: process.env.KC_ADMIN_PASSWORD ?? "admin",
      }),
    }
  );
  if (!res.ok) throw new Error(`Failed to get admin token: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function getRealmToken(
  username: string,
  password: string,
  realm = KC_REALM
): Promise<string> {
  const res = await fetch(
    `${KC_BASE}/realms/${realm}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "phasetwo-ui-dev",
        grant_type: "password",
        username,
        password,
      }),
    }
  );
  if (!res.ok)
    throw new Error(`Failed to get token for ${username}: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

// ── Organizations ─────────────────────────────────────────────────────────────

export interface Org {
  id: string;
  name: string;
  displayName?: string;
  attributes?: Record<string, string[]>;
  domains?: { domainName: string; verified: boolean }[];
}

export async function listOrgs(
  token: string,
  params?: { search?: string; first?: number; max?: number }
): Promise<Org[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.first !== undefined) qs.set("first", String(params.first));
  if (params?.max !== undefined) qs.set("max", String(params.max));
  const url = `${KC_BASE}/realms/${KC_REALM}/orgs${qs.size ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Failed to list orgs: ${res.status}`);
  return typed<Org[]>(res);
}

export async function getOrg(token: string, orgId: string): Promise<Org> {
  const res = await fetch(`${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to get org: ${res.status}`);
  return typed<Org>(res);
}

export async function getOrgCount(token: string): Promise<number> {
  const res = await fetch(`${KC_BASE}/realms/${KC_REALM}/orgs/count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to get org count: ${res.status}`);
  return typed<number>(res);
}

export async function createOrg(
  token: string,
  name: string,
  displayName?: string,
  attributes?: Record<string, string[]>
): Promise<string> {
  const res = await fetch(`${KC_BASE}/realms/${KC_REALM}/orgs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, displayName: displayName ?? name, attributes }),
  });
  if (!res.ok) throw new Error(`Failed to create org "${name}": ${res.status}`);
  const location = res.headers.get("location") ?? "";
  return location.split("/").at(-1) ?? "";
}

export async function updateOrg(
  token: string,
  orgId: string,
  patch: Partial<Org>
): Promise<void> {
  const res = await fetch(`${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to update org: ${res.status}`);
}

export async function deleteOrg(token: string, orgId: string): Promise<void> {
  await fetch(`${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function findOrgByName(
  token: string,
  name: string
): Promise<Org | undefined> {
  const orgs = await listOrgs(token, { search: name });
  return orgs.find((o) => o.name === name);
}

// ── Members ───────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  username: string;
}

export async function listMembers(
  token: string,
  orgId: string
): Promise<Member[]> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/members`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to list members: ${res.status}`);
  return typed<Member[]>(res);
}

export async function getMemberCount(
  token: string,
  orgId: string
): Promise<number> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/members/count`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get member count: ${res.status}`);
  return typed<number>(res);
}

export async function checkMembership(
  token: string,
  orgId: string,
  userId: string
): Promise<boolean> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/members/${userId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 204) return true;
  if (res.status === 404) return false;
  throw new Error(`Unexpected membership check status: ${res.status}`);
}

export async function addMember(
  token: string,
  orgId: string,
  userId: string
): Promise<void> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/members/${userId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Failed to add member: ${res.status}`);
}

export async function removeMember(
  token: string,
  orgId: string,
  userId: string
): Promise<void> {
  await fetch(`${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/members/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getMemberAttributes(
  token: string,
  orgId: string,
  userId: string
): Promise<Record<string, string[]>> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/members/${userId}/attributes`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get member attributes: ${res.status}`);
  return typed<Record<string, string[]>>(res);
}

export async function setMemberAttributes(
  token: string,
  orgId: string,
  userId: string,
  attributes: Record<string, string[]>
): Promise<void> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/members/${userId}/attributes`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attributes }),
    }
  );
  if (!res.ok) throw new Error(`Failed to set member attributes: ${res.status}`);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function findUserId(
  token: string,
  username: string
): Promise<string | undefined> {
  const res = await fetch(
    `${KC_BASE}/admin/realms/${KC_REALM}/users?username=${encodeURIComponent(username)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to find user: ${res.status}`);
  const users = (await res.json()) as Array<{ id: string; username: string }>;
  return users.find((u) => u.username === username)?.id;
}

export async function getUserOrgs(
  token: string,
  userId: string
): Promise<Org[]> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/users/${userId}/orgs`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get user orgs: ${res.status}`);
  return typed<Org[]>(res);
}

// ── Org Roles ─────────────────────────────────────────────────────────────────

export interface OrgRole {
  id?: string;
  name: string;
  description?: string;
}

export async function listOrgRoles(
  token: string,
  orgId: string
): Promise<OrgRole[]> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to list org roles: ${res.status}`);
  return typed<OrgRole[]>(res);
}

export async function getOrgRole(
  token: string,
  orgId: string,
  roleName: string
): Promise<OrgRole> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles/${encodeURIComponent(roleName)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get org role: ${res.status}`);
  return typed<OrgRole>(res);
}

export async function createOrgRole(
  token: string,
  orgId: string,
  role: OrgRole
): Promise<void> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(role),
    }
  );
  if (!res.ok) throw new Error(`Failed to create org role: ${res.status}`);
}

export async function updateOrgRole(
  token: string,
  orgId: string,
  roleName: string,
  patch: Partial<OrgRole>
): Promise<void> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles/${encodeURIComponent(roleName)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) throw new Error(`Failed to update org role: ${res.status}`);
}

export async function deleteOrgRole(
  token: string,
  orgId: string,
  roleName: string
): Promise<void> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles/${encodeURIComponent(roleName)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Failed to delete org role: ${res.status}`);
}

export async function getUsersWithRole(
  token: string,
  orgId: string,
  roleName: string
): Promise<Member[]> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles/${encodeURIComponent(roleName)}/users`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get users with role: ${res.status}`);
  return typed<Member[]>(res);
}

export async function checkUserHasRole(
  token: string,
  orgId: string,
  roleName: string,
  userId: string
): Promise<boolean> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles/${encodeURIComponent(roleName)}/users/${userId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 204) return true;
  if (res.status === 404) return false;
  throw new Error(`Unexpected role check status: ${res.status}`);
}

export async function grantOrgRole(
  token: string,
  orgId: string,
  userId: string,
  roleName: string
): Promise<void> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles/${encodeURIComponent(roleName)}/users/${userId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Failed to grant role: ${res.status}`);
}

export async function revokeOrgRole(
  token: string,
  orgId: string,
  userId: string,
  roleName: string
): Promise<void> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/roles/${encodeURIComponent(roleName)}/users/${userId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Failed to revoke role: ${res.status}`);
}

export async function listMemberRoles(
  token: string,
  orgId: string,
  userId: string
): Promise<OrgRole[]> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/users/${userId}/orgs/${orgId}/roles`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to list member roles: ${res.status}`);
  return typed<OrgRole[]>(res);
}

// ── Invitations ───────────────────────────────────────────────────────────────

export interface Invitation {
  id: string;
  email: string;
  createdAt?: number;
  roles?: string[];
}

export async function createInvitation(
  token: string,
  orgId: string,
  email: string,
  options?: { send?: boolean; roles?: string[] }
): Promise<string> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/invitations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, send: options?.send ?? false, roles: options?.roles ?? [] }),
    }
  );
  if (!res.ok) throw new Error(`Failed to create invitation: ${res.status}`);
  const location = res.headers.get("location") ?? "";
  return location.split("/").at(-1) ?? "";
}

export async function listInvitations(
  token: string,
  orgId: string
): Promise<Invitation[]> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/invitations`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to list invitations: ${res.status}`);
  return typed<Invitation[]>(res);
}

export async function getInvitationCount(
  token: string,
  orgId: string
): Promise<number> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/invitations/count`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get invitation count: ${res.status}`);
  return typed<number>(res);
}

export async function deleteInvitation(
  token: string,
  orgId: string,
  invitationId: string
): Promise<void> {
  const res = await fetch(
    `${KC_BASE}/realms/${KC_REALM}/orgs/${orgId}/invitations/${invitationId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Failed to delete invitation: ${res.status}`);
}
