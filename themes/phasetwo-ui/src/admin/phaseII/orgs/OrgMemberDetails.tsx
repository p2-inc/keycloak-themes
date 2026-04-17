import { useEffect, useState } from "react";
import {
  Button,
  ButtonVariant,
  PageSection,
  Tab,
  TabTitleText,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useAlerts } from "@/shared/keycloak-ui-shared";
import { ViewHeader } from "../../components/view-header/ViewHeader";
import {
  RoutableTabs,
  useRoutableTab,
} from "../../components/routable-tabs/RoutableTabs";
import useOrgFetcher, {
  PhaseTwoOrganizationMemberAttributesRepresentation,
  PhaseTwoOrganizationUserRepresentation,
} from "./useOrgFetcher";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { differenceBy } from "lodash-es";
import { TrashAltIcon } from "@patternfly/react-icons";
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  cellWidth,
} from "@patternfly/react-table";
import { OrgMemberAttribute } from "./form/OrgMemberAttribute";
import { toOrg } from "./routes/Org";
import { toOrgMember, type OrgMemberTab } from "./routes/OrgMember";

type OrgMemberRouteParams = {
  realm: string;
  orgId: string;
  userId: string;
  tab: OrgMemberTab;
};

export default function OrgMemberDetails() {
  const { orgId, userId } = useParams<OrgMemberRouteParams>();
  const { t } = useTranslation();
  const { addAlert, addError } = useAlerts();
  const { realm } = useRealm();
  const navigate = useNavigate();

  const {
    getRolesForOrg,
    listOrgRolesForUser,
    setOrgRoleForUser,
    revokeOrgRoleForUser,
    getUserAttributesForOrgMember,
    updateAttributesForOrgMember,
    getOrgMembers,
  } = useOrgFetcher(realm);

  const [user, setUser] =
    useState<PhaseTwoOrganizationUserRepresentation | null>(null);
  const [orgRoles, setOrgRoles] = useState<RoleRepresentation[]>([]);
  const [userOrgRoles, setUserOrgRoles] = useState<
    { id: string; name: string }[]
  >([]);
  const [tableRows, setTableRows] = useState<
    { id: string; name: string; description?: string; selected: boolean }[]
  >([]);
  const [userAttributes, setUserAttributes] =
    useState<PhaseTwoOrganizationMemberAttributesRepresentation | null>(null);
  const [rolesKey, setRolesKey] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const members = await getOrgMembers(orgId!, { first: 0, max: 1000 });
        const found = members.find((m) => m.id === userId);
        if (found) setUser(found);
      } catch (e) {
        addError("errorFetching", e);
      }
    };
    void fetchUser();
  }, []);

  useEffect(() => {
    const fetchOrgRoles = async () => {
      const roles = await getRolesForOrg(orgId!);
      setOrgRoles(roles);
    };
    void fetchOrgRoles();
  }, []);

  const fetchUserRoles = async () => {
    if (!user) return;
    const result = await listOrgRolesForUser(orgId!, user);
    if (!result.error) {
      setUserOrgRoles(result.data);
      const hasRoleIds = result.data.map((r: { id: string }) => r.id);
      const roleMap = orgRoles.map((orgRole) => ({
        ...orgRole,
        selected: hasRoleIds.includes(orgRole.id),
      }));
      // @ts-ignore
      setTableRows(roleMap);
    }
  };

  useEffect(() => {
    if (user && orgRoles.length > 0) {
      void fetchUserRoles();
    }
  }, [user, orgRoles, rolesKey]);

  const fetchUserAttributes = async () => {
    try {
      const attributes = await getUserAttributesForOrgMember(orgId!, userId!);
      setUserAttributes(attributes);
    } catch (error) {
      console.error("Failed to fetch user attributes:", error);
    }
  };

  useEffect(() => {
    void fetchUserAttributes();
  }, []);

  const saveRoles = async () => {
    if (!user) return;
    const newRoles = differenceBy(
      tableRows.filter((r) => r.selected),
      userOrgRoles,
      "id",
    );
    const rolesToRemove = differenceBy(
      userOrgRoles,
      tableRows.filter((r) => r.selected),
      "id",
    );

    if (newRoles.length === 0 && rolesToRemove.length === 0) {
      addAlert("No changes to save.");
      return;
    }

    try {
      await Promise.all(
        newRoles.map((newRole) => setOrgRoleForUser(orgId!, newRole, user)),
      );
    } catch (e) {
      addError("Error assigning roles.", e);
    }

    try {
      await Promise.all(
        rolesToRemove.map((roleToRemove) =>
          revokeOrgRoleForUser(orgId!, roleToRemove, user),
        ),
      );
    } catch (e) {
      addError("Error removing roles.", e);
    }

    addAlert("Role assignments updated.");
    setRolesKey((k) => k + 1);
  };

  const removeAttribute = async (row: { name: string; value: string[] }) => {
    try {
      const updatedAttributes = { ...userAttributes };
      delete updatedAttributes[row.name];
      await updateAttributesForOrgMember(orgId!, userId!, updatedAttributes);
      void fetchUserAttributes();
    } catch (error) {
      console.error("Failed to remove attribute:", error);
    }
  };

  const useTab = (tabName: OrgMemberTab) =>
    useRoutableTab(
      toOrgMember({
        realm,
        orgId: orgId!,
        userId: userId!,
        tab: tabName,
      }),
    );

  const rolesTab = useTab("roles");
  const attributesTab = useTab("attributes");

  const backToMembers = () =>
    navigate(toOrg({ realm, orgId: orgId!, tab: "members" }));

  const roleColumns = [
    { name: "name" },
    { name: "description", displayKey: t("description") },
    {
      name: "hasRole",
      displayKey: "Has role?",
      cellRenderer: (row: any) =>
        userOrgRoles.find((or) => or.id === row.id) ? t("yes") : t("no"),
    },
  ];

  const attributeColumns = [
    { name: "name", displayKey: t("userOrganizationAttributeName") },
    { name: "value", displayKey: t("userOrganizationAttributeValue") },
  ];

  const attributeRows = userAttributes
    ? Object.keys(userAttributes).map((key) => ({
        name: key,
        value: userAttributes[key],
      }))
    : [];

  return (
    <>
      <ViewHeader
        titleKey={user ? user.username || user.email || userId! : userId!}
        divider={false}
        subKey={
          <Button
            variant={ButtonVariant.link}
            isInline
            onClick={backToMembers}
            className="pf-v5-u-font-size-sm"
          >
            ← Back to Members
          </Button>
        }
      />
      <PageSection variant="light" className="pf-v5-u p-0">
        <RoutableTabs isBox mountOnEnter>
          <Tab
            id="roles"
            title={<TabTitleText>Roles</TabTitleText>}
            {...rolesTab}
          >
            <PageSection
              variant="light"
              className="keycloak__form pf-v5-u-pt-lg"
            >
              <Table aria-label="Assign roles to member" variant="compact">
                <Thead>
                  <Tr>
                    <Th className={cellWidth(10)().className}>
                      <input
                        type="checkbox"
                        name="selectAll"
                        id="selectAll"
                        checked={
                          tableRows.length > 0 &&
                          tableRows.filter((r) => r.selected).length ===
                            tableRows.length
                        }
                        onChange={(e) =>
                          setTableRows(
                            tableRows.map((r) => ({
                              ...r,
                              selected: e.currentTarget.checked,
                            })),
                          )
                        }
                      />
                    </Th>
                    {roleColumns.map((c) => (
                      <Th key={c.name}>{t(c.displayKey || c.name)}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {tableRows.map((row) => (
                    <Tr key={row.id}>
                      <Td>
                        <input
                          type="checkbox"
                          name={row.id}
                          id={row.id}
                          checked={row.selected}
                          onChange={() =>
                            setTableRows(
                              tableRows.map((r) => ({
                                ...r,
                                selected:
                                  r.id === row.id ? !r.selected : r.selected,
                              })),
                            )
                          }
                        />
                      </Td>
                      {roleColumns.map((c) => (
                        <Td key={c.name}>
                          {c.cellRenderer
                            ? c.cellRenderer(row)
                            : row[c.name as keyof typeof row]}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <div className="pf-v5-u-mt-md">
                <Button variant="primary" onClick={saveRoles}>
                  {t("save")}
                </Button>
              </div>
            </PageSection>
          </Tab>

          <Tab
            id="attributes"
            title={<TabTitleText>Attributes</TabTitleText>}
            {...attributesTab}
          >
            <PageSection
              variant="light"
              className="keycloak__form pf-v5-u-pt-lg"
            >
              <Table
                aria-label="Organization member attributes"
                variant="compact"
              >
                <Thead>
                  <Tr>
                    {attributeColumns.map((c) => (
                      <Th key={c.name}>{c.displayKey}</Th>
                    ))}
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {attributeRows.length === 0 ? (
                    <Tr>
                      <Td colSpan={3}>{t("noOrganizationUserAttributes")}</Td>
                    </Tr>
                  ) : (
                    attributeRows.map((row) => (
                      <Tr key={row.name}>
                        {attributeColumns.map((c) => (
                          <Td key={c.name}>
                            {row[c.name as keyof typeof row]}
                          </Td>
                        ))}
                        <Td className="pf-v5-u-text-align-right">
                          <Button
                            variant={ButtonVariant.plain}
                            isDanger
                            onClick={() => removeAttribute(row)}
                            aria-label={`Remove ${row.name}`}
                          >
                            <TrashAltIcon />
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
              <OrgMemberAttribute
                orgId={orgId!}
                userId={userId!}
                userAttributes={
                  userAttributes as PhaseTwoOrganizationMemberAttributesRepresentation
                }
                updateUser={fetchUserAttributes}
              />
            </PageSection>
          </Tab>
        </RoutableTabs>
      </PageSection>
    </>
  );
}
