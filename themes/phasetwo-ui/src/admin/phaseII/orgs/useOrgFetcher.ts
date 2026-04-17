import { useState } from "react";
import type { OrgRepresentation } from "./routes";
import type { OrgFormSubmission } from "./modals/NewOrgModal";
import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import type GroupRepresentation from "@keycloak/keycloak-admin-client/lib/defs/groupRepresentation";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import IdentityProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import { useAdminClient } from "../../admin-client";
import { SyncMode } from "./OrgIdentityProviders";
import { OrgConfigType } from "./modals/ManageOrgSettingsDialog";
import { useEnvironment } from "@/shared/keycloak-ui-shared";
import type { Environment } from "../../environment";

export type PhaseTwoOrganizationUserRepresentation = UserRepresentation & {
  organizationMemberAttributes: Record<string, string[]>;
  membership: GroupRepresentation[];
};

export type PhaseTwoOrganizationMemberAttributesRepresentation = Record<
  string,
  string[]
>;

export type OrganizationDomainRepresentation = {
  domain_name: string;
  verified: boolean;
  record_key: string;
  record_value: string;
  type: string;
};

type OrgResp = Response & { error: string; data?: any[] };

async function getResponseError(response: Response) {
  const jsonResponse = response.clone();
  const contentType = response.headers.get("content-type");
  let message = "";

  if (contentType?.includes("application/json")) {
    const data = await jsonResponse.json().catch(() => undefined);

    if (typeof data === "object" && data !== null) {
      const errorFields = ["error", "errorMessage", "message"];

      for (const field of errorFields) {
        const value = (data as Record<string, unknown>)[field];

        if (typeof value === "string" && value.trim().length > 0) {
          message = value;
          break;
        }
      }
    }
  }

  if (!message) {
    message = (await response.text().catch(() => "")).trim();
  }

  if (!message) {
    message =
      response.statusText || `Request failed with status ${response.status}`;
  }

  return new Error(message);
}

export default function useOrgFetcher(realm: string) {
  const { environment } = useEnvironment<Environment>();
  const { adminClient } = useAdminClient();
  const [orgs] = useState([]);
  const [org, setOrg] = useState<OrgRepresentation | null>();

  const authUrl = environment.serverBaseUrl;
  const baseUrl = `${authUrl}/realms/${realm}`;
  const adminUrl = `${authUrl}/admin/realms/${realm}`;

  async function fetchGet(url: string) {
    const token = await adminClient.getAccessToken();
    return await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      redirect: "follow",
    });
  }

  async function fetchModify(url: string, body: any, verb: "POST" | "PUT") {
    const token = await adminClient.getAccessToken();
    return await fetch(url, {
      method: verb,
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      redirect: "follow",
    });
  }

  /*
  async function fetchPostForm(url: string, data: FormData) {
    const token = await adminClient.getAccessToken();
    return await fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: data,
      redirect: "follow",
    });
  }
  */

  async function fetchPostRaw(url: string, data: string) {
    const token = await adminClient.getAccessToken();
    return await fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: data,
      redirect: "follow",
    });
  }

  async function fetchDelete(url: string) {
    const token = await adminClient.getAccessToken();
    return await fetch(url, {
      method: "DELETE",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      redirect: "follow",
    });
  }

  async function fetchPost(url: string, body: any) {
    return await fetchModify(url, body, "POST");
  }
  async function fetchPut(url: string, body: any) {
    return await fetchModify(url, body, "PUT");
  }

  async function refreshOrgs(first: number, max: number, search: string) {
    let query = `first=${first}&max=${max}`;
    if (search.length > 0) {
      query = `${query}&search=${search}`;
    }
    const resp = await fetchGet(`${baseUrl}/orgs?${query}`);
    return await resp.json();
  }

  async function createOrg(org: OrgFormSubmission) {
    let resp = (await fetchPost(`${baseUrl}/orgs`, {
      ...org,
      realm,
    })) as OrgResp;

    // successful response is just an empty 201
    if (resp.ok) {
      return { success: true, message: "Org created successfully." };
    }

    resp = await resp.json();
    // @ts-ignore
    const error = resp.error;
    return { error: true, message: error };
  }

  async function getOrg(orgId: string) {
    const resp = await fetchGet(`${baseUrl}/orgs/${orgId}`);
    setOrg(await resp.json());
  }

  async function updateOrg(org: OrgRepresentation) {
    const resp = await fetchPut(`${baseUrl}/orgs/${org.id}`, {
      ...org,
    });
    if (resp.ok) {
      setOrg(org);
      return { success: true, message: "Organization updated." };
    }
    return { error: true, message: await resp.text() };
  }

  async function deleteOrg(org: OrgRepresentation) {
    let resp = (await fetchDelete(`${baseUrl}/orgs/${org.id}`)) as OrgResp;
    if (resp.ok) {
      return { success: true, message: "Organization removed." };
    }
    resp = await resp.json();
    return {
      error: true,
      // @ts-ignore
      message: `${org.name} could not be removed. (${resp.error})`,
    };
  }

  type OrgMemberOptions = {
    first: number;
    max: number;
    search?: string;
  };
  async function getOrgMembers(
    orgId: string,
    { first, max, search }: OrgMemberOptions = {
      first: 1,
      max: 100,
    },
  ): Promise<PhaseTwoOrganizationUserRepresentation[]> {
    let query = `first=${first}&max=${max}`;
    query = search ? `${query}&search=${search}` : query;
    const resp = await fetchGet(`${baseUrl}/orgs/${orgId}/members?${query}`);
    const result = await resp.json();
    return result;
  }
  async function addOrgMember(orgId: string, userId: string) {
    const token = await adminClient.getAccessToken();
    await fetch(`${baseUrl}/orgs/${orgId}/members/${userId}`, {
      method: "PUT",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      redirect: "follow",
    });
  }

  async function getOrgsForUser(userId: string): Promise<OrgRepresentation[]> {
    const resp = await fetchGet(`${baseUrl}/users/${userId}/orgs`);
    return await resp.json();
  }

  async function getUserAttributesForOrgMember(
    orgId: string,
    userId: string,
  ): Promise<PhaseTwoOrganizationMemberAttributesRepresentation> {
    const resp = await fetchGet(
      `${baseUrl}/orgs/${orgId}/members/${userId}/attributes`,
    );
    return await resp.json();
  }

  async function updateAttributesForOrgMember(
    orgId: string,
    userId: string,
    attributes: Record<string, string[]>,
  ) {
    const token = await adminClient.getAccessToken();
    await fetch(`${baseUrl}/orgs/${orgId}/members/${userId}/attributes`, {
      method: "PUT",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        attributes,
      }),
      redirect: "follow",
    });
  }

  async function removeMemberFromOrg(orgId: string, userId: string) {
    await fetchDelete(`${baseUrl}/orgs/${orgId}/members/${userId}`);
  }

  async function createInvitation(
    orgId: string,
    email: string,
    send: boolean,
    redirectUri: string,
  ) {
    const resp = await fetchPost(`${baseUrl}/orgs/${orgId}/invitations`, {
      email,
      send,
      redirectUri,
    });

    if (!resp.ok) {
      throw await getResponseError(resp);
    }
  }

  async function getOrgInvitations(orgId: string) {
    const resp = await fetchGet(`${baseUrl}/orgs/${orgId}/invitations`);

    if (resp.ok) {
      return await resp.json();
    }
    return [];
  }

  async function deleteOrgInvitation(orgId: string, invitationId: string) {
    const resp = await fetchDelete(
      `${baseUrl}/orgs/${orgId}/invitations/${invitationId}`,
    );

    if (!resp.ok) {
      throw await getResponseError(resp);
    }
  }

  async function resendOrgInvitation(orgId: string, invitationId: string) {
    const resp = await fetchPut(
      `${baseUrl}/orgs/${orgId}/invitations/${invitationId}/resend-email`,
      {},
    );

    if (!resp.ok) {
      throw await getResponseError(resp);
    }
  }

  async function getRolesForOrg(orgId: string) {
    const resp = await fetchGet(`${baseUrl}/orgs/${orgId}/roles`);
    return await resp.json();
  }

  async function getPortalLink(orgId: string, userId: string = "") {
    const body = "userId=" + encodeURIComponent(userId);

    const resp = await fetchPostRaw(
      `${baseUrl}/orgs/${orgId}/portal-link`,
      body,
    );

    return await resp.json();
  }

  async function deleteRoleFromOrg(orgId: string, role: RoleRepresentation) {
    let resp = (await fetchDelete(
      `${baseUrl}/orgs/${orgId}/roles/${role.name}`,
    )) as OrgResp;
    if (resp.ok) {
      return {
        success: true,
        message: `${role.name} removed from Organization.`,
      };
    }

    resp = await resp.json();
    return {
      error: true,
      message: resp.error,
    };
  }

  async function createRoleForOrg(orgId: string, role: RoleRepresentation) {
    let resp = (await fetchPost(`${baseUrl}/orgs/${orgId}/roles`, {
      id: "fake-id",
      name: role.name,
      description: role.description || "",
    })) as OrgResp;

    if (resp.ok) {
      return {
        success: true,
        message: `${role.name} added to Organization.`,
      };
    }

    resp = await resp.json();
    return {
      error: true,
      message: resp.error,
    };
  }

  async function updateRoleForOrg(
    orgId: string,
    role: { name: string; description?: string },
  ) {
    let resp = (await fetchPut(
      `${baseUrl}/orgs/${orgId}/roles/${role.name}`,
      role,
    )) as OrgResp;
    if (resp.ok) {
      return {
        success: true,
        message: `${role.name} updated.`,
      };
    }

    resp = await resp.json();
    return {
      error: true,
      message: resp.error,
    };
  }

  // GET /:realm/orgs/:orgId/roles/:name/users/:userId
  async function checkOrgRoleForUser(
    orgId: string,
    role: RoleRepresentation,
    user: UserRepresentation,
  ) {
    let resp = (await fetchGet(
      `${baseUrl}/orgs/${orgId}/roles/${role.name}/users/${user.id}`,
    )) as OrgResp;

    if (resp.ok) {
      return {
        success: true,
        message: `User has role: ${role.name}.`,
      };
    }

    resp = await resp.json();
    return {
      error: true,
      message: resp.error,
    };
  }

  // GET /:realm/users/:userId/orgs/:orgId/roles
  async function listOrgRolesForUser(orgId: string, user: UserRepresentation) {
    const resp = (await fetchGet(
      `${baseUrl}/users/${user.id}/orgs/${orgId}/roles`,
    )) as OrgResp;

    if (resp.ok) {
      return {
        success: true,
        data: await resp.json(),
      };
    }

    return {
      error: true,
      message: await resp.json(),
    };
  }

  // PUT /:realm/orgs/:orgId/roles/:name/users/:userId
  async function setOrgRoleForUser(
    orgId: string,
    role: RoleRepresentation,
    user: UserRepresentation,
  ) {
    let resp = (await fetchPut(
      `${baseUrl}/orgs/${orgId}/roles/${role.name}/users/${user.id}`,
      {},
    )) as OrgResp;

    if (resp.ok) {
      return {
        success: true,
        message: `${role.name} assigned to user.`,
      };
    }

    resp = await resp.json();
    return {
      error: true,
      message: resp.error,
    };
  }

  // DELETE /:realm/orgs/:orgId/roles/:name/users/:userId
  async function revokeOrgRoleForUser(
    orgId: string,
    role: RoleRepresentation,
    user: UserRepresentation,
  ) {
    let resp = (await fetchDelete(
      `${baseUrl}/orgs/${orgId}/roles/${role.name}/users/${user.id}`,
    )) as OrgResp;

    if (resp.ok) {
      return {
        success: true,
        message: `${role.name} revoked for user.`,
      };
    }

    resp = await resp.json();
    return {
      error: true,
      message: resp.error,
    };
  }

  // PUT /:realm/identity-provider/instances/:alias
  async function updateIdentityProvider(
    idp: IdentityProviderRepresentation,
    alias: string,
  ) {
    try {
      await adminClient.identityProviders.update({ alias }, { ...idp });
      return {
        success: true,
        message: `${idp.displayName} updated for this org.`,
      };
    } catch (error) {
      return {
        error: true,
        message: error,
      };
    }
  }

  // GET /:realm/identity-provider/instances
  async function getIdpsForOrg(orgId: OrgRepresentation["id"]) {
    try {
      const resp = await fetchGet(`${baseUrl}/orgs/${orgId}/idps`);
      if (resp.ok) {
        return (await resp.json()) as IdentityProviderRepresentation[];
      }
      return {
        error: true,
        message: "Failed to fetch IDPs for org.",
      };
    } catch (error) {
      return {
        error: true,
        message: error,
      };
    }
  }

  async function getIdpsForRealm({
    first = 0,
    max = 100,
    search,
  }: {
    first: number;
    max: number;
    search?: string;
  }) {
    try {
      let query = `first=${first}&max=${max}`;
      if (search && search.length > 0) {
        query = `${query}&search=${search}`;
      }
      const resp = await fetchGet(
        `${adminUrl}/identity-provider/instances?${query}`,
      );
      if (resp.ok) {
        return (await resp.json()) as IdentityProviderRepresentation[];
      }
      return {
        error: true,
        message: "Failed to fetch IDPs for org.",
      };
    } catch (error) {
      return {
        error: true,
        message: error,
      };
    }
  }

  // POST /:realm/orgs/:orgId/idps/link
  async function linkIDPtoOrg(
    orgId: OrgRepresentation["id"],
    idpInformation: {
      alias: IdentityProviderRepresentation["alias"];
      post_broker_flow?: IdentityProviderRepresentation["postBrokerLoginFlowAlias"];
      sync_mode?: SyncMode;
    },
  ) {
    try {
      const resp = await fetchPost(
        `${baseUrl}/orgs/${orgId}/idps/link`,
        idpInformation,
      );
      if (!resp.ok) {
        throw new Error("Failed to link IDP to org.");
      }
      if (resp.status === 201) {
        return {
          success: true,
          message: `${idpInformation.alias} updated for this org.`,
        };
      }
      if (resp.status === 409) {
        return {
          error: true,
          message: "Identity Provider already linked to this org.",
        };
      }
    } catch (error) {
      return {
        error: true,
        message: error,
      };
    }
  }

  // POST /:realm/orgs/:orgId/idps/unlink
  async function unlinkIDPtoOrg(
    orgId: OrgRepresentation["id"],
    idpAlias: IdentityProviderRepresentation["alias"],
  ) {
    try {
      const resp = await fetchPost(
        `${baseUrl}/orgs/${orgId}/idps/${idpAlias}/unlink`,
        {},
      );
      if (!resp.ok) {
        throw new Error("Failed to unlink Identity Provider.");
      }
      if (resp.status === 204) {
        return {
          success: true,
          message: `Unlinked Identity Provider.`,
        };
      }
    } catch (error) {
      return {
        error: true,
        message: error,
      };
    }
  }

  // GET /:realm/orgs/config
  async function getOrgsConfig() {
    try {
      const resp = await fetchGet(`${baseUrl}/orgs/config`);
      if (resp.ok) {
        return (await resp.json()) as OrgConfigType;
      }
      return {
        error: true,
        message: "Failed to fetch orgs config.",
      };
    } catch (error) {
      return {
        error: true,
        message: error,
      };
    }
  }

  async function updateOrgsConfig(orgsConfig: OrgConfigType) {
    try {
      const resp = await fetchPut(`${baseUrl}/orgs/config`, orgsConfig);

      if (resp.ok) {
        return {
          success: true,
          message: "Organizations config updated.",
        };
      }
      throw new Error("Failed to update organizations config.");
    } catch (error) {
      return {
        error: true,
        message: error,
      };
    }
  }

  // GET /:realm/orgs/:orgId/domains
  async function getOrgDomains(
    orgId: string,
  ): Promise<OrganizationDomainRepresentation[]> {
    const resp = await fetchGet(`${baseUrl}/orgs/${orgId}/domains`);
    if (resp.ok) {
      return await resp.json();
    }
    return [];
  }

  // GET /:realm/orgs/:orgId/domains/:domainName
  async function getOrgDomain(
    orgId: string,
    domainName: string,
  ): Promise<OrganizationDomainRepresentation | null> {
    const resp = await fetchGet(
      `${baseUrl}/orgs/${orgId}/domains/${encodeURIComponent(domainName)}`,
    );
    if (resp.ok) {
      return await resp.json();
    }
    return null;
  }

  // POST /:realm/orgs/:orgId/domains/:domainName/verify
  async function verifyDomain(orgId: string, domainName: string) {
    const resp = await fetchPost(
      `${baseUrl}/orgs/${orgId}/domains/${encodeURIComponent(domainName)}/verify`,
      {},
    );
    if (resp.ok) {
      return { success: true, message: "Domain verification triggered." };
    }
    return { error: true, message: await resp.text() };
  }

  return {
    addOrgMember,
    checkOrgRoleForUser,
    createInvitation,
    createOrg,
    createRoleForOrg,
    deleteOrg,
    deleteOrgInvitation,
    deleteRoleFromOrg,
    getIdpsForOrg,
    getIdpsForRealm,
    getOrg,
    getOrgDomain,
    getOrgDomains,
    getOrgInvitations,
    getOrgMembers,
    getOrgsConfig,
    getOrgsForUser,
    getPortalLink,
    getRolesForOrg,
    getUserAttributesForOrgMember,
    linkIDPtoOrg,
    listOrgRolesForUser,
    org,
    orgs,
    refreshOrgs,
    removeMemberFromOrg,
    resendOrgInvitation,
    revokeOrgRoleForUser,
    setOrgRoleForUser,
    unlinkIDPtoOrg,
    updateAttributesForOrgMember,
    verifyDomain,
    updateIdentityProvider,
    updateOrg,
    updateOrgsConfig,
    updateRoleForOrg,
  };
}
