/**
 * Keycloak + Phase Two Admin REST API helpers.
 * Used by global-setup, api specs, and browser test fixtures.
 */

export const KC_BASE = process.env.KC_BASE_URL ?? "http://localhost:8080/auth";
export const KC_REALM = process.env.KC_REALM ?? "phasetwo-ui";

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
}

export async function listOrgs(token: string): Promise<Org[]> {
  const res = await fetch(`${KC_BASE}/realms/${KC_REALM}/orgs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to list orgs: ${res.status}`);
  return res.json();
}

export async function createOrg(
  token: string,
  name: string,
  displayName?: string
): Promise<string> {
  const res = await fetch(`${KC_BASE}/realms/${KC_REALM}/orgs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, displayName: displayName ?? name }),
  });
  if (!res.ok) throw new Error(`Failed to create org "${name}": ${res.status}`);
  // Phase Two returns the id in the Location header
  const location = res.headers.get("location") ?? "";
  return location.split("/").at(-1) ?? "";
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
  const orgs = await listOrgs(token);
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
  return res.json();
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

// ── Org Roles ─────────────────────────────────────────────────────────────────

export interface OrgRole {
  id: string;
  name: string;
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
  return res.json();
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
  return res.json();
}
