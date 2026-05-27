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
import { usePhaseTwoClient } from "../api/client";
import type { components } from "../api/client";

export type PhaseTwoOrganizationUserRepresentation = UserRepresentation & {
  organizationMemberAttributes: Record<string, string[]>;
  membership: GroupRepresentation[];
};

export type PhaseTwoOrganizationMemberAttributesRepresentation = Record<
  string,
  string[]
>;

export type OrganizationDomainRepresentation =
  components["schemas"]["OrganizationDomainRepresentation"];

export type OrganizationScimRepresentation =
  components["schemas"]["OrganizationScimRepresentation"];

export type OrganizationScimAuth =
  components["schemas"]["OrganizationScimAuth"];

async function getResponseError(response: Response): Promise<Error> {
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
  const { adminClient } = useAdminClient();
  const client = usePhaseTwoClient();
  const [orgs] = useState([]);
  const [org, setOrg] = useState<OrgRepresentation | null>();

  async function refreshOrgs(first: number, max: number, search: string) {
    const { data } = await client.GET("/{realm}/orgs", {
      params: {
        path: { realm },
        query: { first, max, ...(search.length > 0 ? { search } : {}) },
      },
    });
    return data ?? [];
  }

  async function createOrg(org: OrgFormSubmission) {
    const { response } = await client.POST("/{realm}/orgs", {
      params: { path: { realm } },
      body: { ...org, realm },
    });

    if (response.ok) {
      return { success: true, message: "Org created successfully." };
    }

    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function getOrg(orgId: string) {
    const { data } = await client.GET("/{realm}/orgs/{orgId}", {
      params: { path: { realm, orgId } },
    });
    if (data) setOrg(data as OrgRepresentation);
  }

  async function updateOrg(org: OrgRepresentation) {
    const { response } = await client.PUT("/{realm}/orgs/{orgId}", {
      params: { path: { realm, orgId: org.id } },
      body: { ...org },
    });

    if (response.ok) {
      setOrg(org);
      return { success: true, message: "Organization updated." };
    }
    return { error: true, message: await response.text() };
  }

  async function deleteOrg(org: OrgRepresentation) {
    const { response } = await client.DELETE("/{realm}/orgs/{orgId}", {
      params: { path: { realm, orgId: org.id } },
    });

    if (response.ok) {
      return { success: true, message: "Organization removed." };
    }

    const error = await getResponseError(response);
    return { error: true, message: `${org.name} could not be removed. (${error.message})` };
  }

  type OrgMemberOptions = {
    first: number;
    max: number;
    search?: string;
  };

  async function getOrgMembers(
    orgId: string,
    { first, max, search }: OrgMemberOptions = { first: 1, max: 100 },
  ): Promise<PhaseTwoOrganizationUserRepresentation[]> {
    const { data } = await client.GET("/{realm}/orgs/{orgId}/members", {
      params: {
        path: { realm, orgId },
        query: { first, max, ...(search ? { search } : {}) },
      },
    });
    return (data ?? []) as PhaseTwoOrganizationUserRepresentation[];
  }

  async function addOrgMember(orgId: string, userId: string) {
    await client.PUT("/{realm}/orgs/{orgId}/members/{userId}", {
      params: { path: { realm, orgId, userId } },
    });
  }

  async function getOrgsForUser(userId: string): Promise<OrgRepresentation[]> {
    const { data } = await client.GET("/{realm}/users/{userId}/orgs", {
      params: { path: { realm, userId } },
    });
    return (data ?? []) as OrgRepresentation[];
  }

  async function getUserAttributesForOrgMember(
    orgId: string,
    userId: string,
  ): Promise<PhaseTwoOrganizationMemberAttributesRepresentation> {
    const { data } = await client.GET(
      "/{realm}/orgs/{orgId}/members/{userId}/attributes",
      { params: { path: { realm, orgId, userId } } },
    );
    return (data?.attributes ?? {}) as PhaseTwoOrganizationMemberAttributesRepresentation;
  }

  async function updateAttributesForOrgMember(
    orgId: string,
    userId: string,
    attributes: Record<string, string[]>,
  ) {
    await client.PUT("/{realm}/orgs/{orgId}/members/{userId}/attributes", {
      params: { path: { realm, orgId, userId } },
      body: { attributes },
    });
  }

  async function removeMemberFromOrg(orgId: string, userId: string) {
    await client.DELETE("/{realm}/orgs/{orgId}/members/{userId}", {
      params: { path: { realm, orgId, userId } },
    });
  }

  async function createInvitation(
    orgId: string,
    email: string,
    send: boolean,
    redirectUri: string,
  ) {
    const { response } = await client.POST("/{realm}/orgs/{orgId}/invitations", {
      params: { path: { realm, orgId } },
      body: { email, send, redirectUri },
    });

    if (!response.ok) {
      throw await getResponseError(response);
    }
  }

  async function getOrgInvitations(orgId: string) {
    const { data, response } = await client.GET(
      "/{realm}/orgs/{orgId}/invitations",
      { params: { path: { realm, orgId } } },
    );

    if (response.ok) return (data ?? []) as { id: string; email: string; createdAt?: string }[];
    return [] as { id: string; email: string; createdAt?: string }[];
  }

  async function deleteOrgInvitation(orgId: string, invitationId: string) {
    const { response } = await client.DELETE(
      "/{realm}/orgs/{orgId}/invitations/{invitationId}",
      { params: { path: { realm, orgId, invitationId } } },
    );

    if (!response.ok) {
      throw await getResponseError(response);
    }
  }

  async function resendOrgInvitation(orgId: string, invitationId: string) {
    const { response } = await client.PUT(
      "/{realm}/orgs/{orgId}/invitations/{invitationId}/resend-email",
      { params: { path: { realm, orgId, invitationId } } },
    );

    if (!response.ok) {
      throw await getResponseError(response);
    }
  }

  async function getRolesForOrg(orgId: string) {
    const { data } = await client.GET("/{realm}/orgs/{orgId}/roles", {
      params: { path: { realm, orgId } },
    });
    return data ?? [];
  }

  async function getPortalLink(orgId: string, userId: string = "") {
    const { data } = await client.POST("/{realm}/orgs/{orgId}/portal-link", {
      params: { path: { realm, orgId } },
      body: { userId },
      bodySerializer: (body) =>
        new URLSearchParams(body as Record<string, string>).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  }

  async function deleteRoleFromOrg(orgId: string, role: RoleRepresentation) {
    const { response } = await client.DELETE(
      "/{realm}/orgs/{orgId}/roles/{name}",
      { params: { path: { realm, orgId, name: role.name! } } },
    );

    if (response.ok) {
      return { success: true, message: `${role.name} removed from Organization.` };
    }

    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function createRoleForOrg(orgId: string, role: RoleRepresentation) {
    const { response } = await client.POST("/{realm}/orgs/{orgId}/roles", {
      params: { path: { realm, orgId } },
      body: { id: "fake-id", name: role.name, description: role.description ?? "" },
    });

    if (response.ok) {
      return { success: true, message: `${role.name} added to Organization.` };
    }

    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function updateRoleForOrg(
    orgId: string,
    role: { name: string; description?: string },
  ) {
    const { response } = await client.PUT(
      "/{realm}/orgs/{orgId}/roles/{name}",
      {
        params: { path: { realm, orgId, name: role.name } },
        body: role,
      },
    );

    if (response.ok) {
      return { success: true, message: `${role.name} updated.` };
    }

    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function checkOrgRoleForUser(
    orgId: string,
    role: RoleRepresentation,
    user: UserRepresentation,
  ) {
    const { response } = await client.GET(
      "/{realm}/orgs/{orgId}/roles/{name}/users/{userId}",
      { params: { path: { realm, orgId, name: role.name!, userId: user.id! } } },
    );

    if (response.ok) {
      return { success: true, message: `User has role: ${role.name}.` };
    }

    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function listOrgRolesForUser(orgId: string, user: UserRepresentation) {
    const { data, response } = await client.GET(
      "/{realm}/users/{userId}/orgs/{orgId}/roles",
      { params: { path: { realm, userId: user.id!, orgId } } },
    );

    if (response.ok) {
      return {
        success: true,
        data: (data ?? []) as { id: string; name: string; description?: string }[],
      };
    }

    return { error: true, message: await response.json() };
  }

  async function setOrgRoleForUser(
    orgId: string,
    role: RoleRepresentation,
    user: UserRepresentation,
  ) {
    const { response } = await client.PUT(
      "/{realm}/orgs/{orgId}/roles/{name}/users/{userId}",
      { params: { path: { realm, orgId, name: role.name!, userId: user.id! } } },
    );

    if (response.ok) {
      return { success: true, message: `${role.name} assigned to user.` };
    }

    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function revokeOrgRoleForUser(
    orgId: string,
    role: RoleRepresentation,
    user: UserRepresentation,
  ) {
    const { response } = await client.DELETE(
      "/{realm}/orgs/{orgId}/roles/{name}/users/{userId}",
      { params: { path: { realm, orgId, name: role.name!, userId: user.id! } } },
    );

    if (response.ok) {
      return { success: true, message: `${role.name} revoked for user.` };
    }

    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function updateIdentityProvider(
    idp: IdentityProviderRepresentation,
    alias: string,
  ) {
    try {
      await adminClient.identityProviders.update({ alias }, { ...idp });
      return { success: true, message: `${idp.displayName} updated for this org.` };
    } catch (error) {
      return { error: true, message: error };
    }
  }

  async function getIdpsForOrg(orgId: OrgRepresentation["id"]) {
    try {
      const { data, response } = await client.GET("/{realm}/orgs/{orgId}/idps", {
        params: { path: { realm, orgId } },
      });

      if (response.ok) return data as IdentityProviderRepresentation[];
      return { error: true, message: "Failed to fetch IDPs for org." };
    } catch (error) {
      return { error: true, message: error };
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
      const result = await adminClient.identityProviders.find({
        first,
        max,
        ...(search ? { search } : {}),
      });
      return result as IdentityProviderRepresentation[];
    } catch (error) {
      return { error: true, message: error };
    }
  }

  async function linkIDPtoOrg(
    orgId: OrgRepresentation["id"],
    idpInformation: {
      alias: IdentityProviderRepresentation["alias"];
      post_broker_flow?: IdentityProviderRepresentation["postBrokerLoginFlowAlias"];
      sync_mode?: SyncMode;
    },
  ) {
    try {
      const { response } = await client.POST("/{realm}/orgs/{orgId}/idps/link", {
        params: { path: { realm, orgId } },
        body: idpInformation,
      });

      if (!response.ok) throw new Error("Failed to link IDP to org.");

      if (response.status === 201) {
        return { success: true, message: `${idpInformation.alias} updated for this org.` };
      }

      if (response.status === 409) {
        return { error: true, message: "Identity Provider already linked to this org." };
      }
    } catch (error) {
      return { error: true, message: error };
    }
  }

  async function unlinkIDPtoOrg(
    orgId: OrgRepresentation["id"],
    idpAlias: IdentityProviderRepresentation["alias"],
  ) {
    try {
      const { response } = await client.POST(
        "/{realm}/orgs/{orgId}/idps/{alias}/unlink",
        { params: { path: { realm, orgId, alias: idpAlias! } } },
      );

      if (!response.ok) throw new Error("Failed to unlink Identity Provider.");

      if (response.status === 204) {
        return { success: true, message: "Unlinked Identity Provider." };
      }
    } catch (error) {
      return { error: true, message: error };
    }
  }

  async function getOrgsConfig() {
    try {
      const { data, response } = await client.GET("/{realm}/orgs/config", {
        params: { path: { realm } },
      });

      if (response.ok) return data as unknown as OrgConfigType;
      return { error: true, message: "Failed to fetch orgs config." };
    } catch (error) {
      return { error: true, message: error };
    }
  }

  async function updateOrgsConfig(orgsConfig: OrgConfigType) {
    try {
      const { response } = await client.PUT("/{realm}/orgs/config", {
        params: { path: { realm } },
        body: orgsConfig as components["schemas"]["OrganizationConfigRepresentation"],
      });

      if (response.ok) {
        return { success: true, message: "Organizations config updated." };
      }
      throw new Error("Failed to update organizations config.");
    } catch (error) {
      return { error: true, message: error };
    }
  }

  async function getOrgDomains(
    orgId: string,
  ): Promise<OrganizationDomainRepresentation[]> {
    const { data, response } = await client.GET(
      "/{realm}/orgs/{orgId}/domains",
      { params: { path: { realm, orgId } } },
    );

    if (response.ok) return data ?? [];
    return [];
  }

  async function getOrgDomain(
    orgId: string,
    domainName: string,
  ): Promise<OrganizationDomainRepresentation | null> {
    const { data, response } = await client.GET(
      "/{realm}/orgs/{orgId}/domains/{domainName}",
      { params: { path: { realm, orgId, domainName } } },
    );

    if (response.ok) return data ?? null;
    return null;
  }

  async function getScimConfig(
    orgId: string,
  ): Promise<OrganizationScimRepresentation | null> {
    const { data, response } = await client.GET(
      "/{realm}/orgs/{orgId}/scim",
      { params: { path: { realm, orgId } } },
    );
    if (response.ok) return data ?? null;
    return null;
  }

  async function createScimConfig(
    orgId: string,
    config: OrganizationScimRepresentation,
  ) {
    const { response } = await client.POST("/{realm}/orgs/{orgId}/scim", {
      params: { path: { realm, orgId } },
      body: config,
    });
    if (response.ok) return { success: true, message: "SCIM configuration created." };
    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function updateScimConfig(
    orgId: string,
    config: OrganizationScimRepresentation,
  ) {
    const { response } = await client.PUT("/{realm}/orgs/{orgId}/scim", {
      params: { path: { realm, orgId } },
      body: config,
    });
    if (response.ok) return { success: true, message: "SCIM configuration updated." };
    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function deleteScimConfig(orgId: string) {
    const { response } = await client.DELETE("/{realm}/orgs/{orgId}/scim", {
      params: { path: { realm, orgId } },
    });
    if (response.ok) return { success: true, message: "SCIM configuration removed." };
    const error = await getResponseError(response);
    return { error: true, message: error.message };
  }

  async function verifyDomain(orgId: string, domainName: string) {
    const { response } = await client.POST(
      "/{realm}/orgs/{orgId}/domains/{domainName}/verify",
      { params: { path: { realm, orgId, domainName } } },
    );

    if (response.ok) return { success: true, message: "Domain verification triggered." };
    return { error: true, message: await response.text() };
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
    getScimConfig,
    createScimConfig,
    updateScimConfig,
    deleteScimConfig,
  };
}
