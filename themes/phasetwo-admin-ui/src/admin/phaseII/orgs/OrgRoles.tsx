import { useState } from "react";
import {
  AlertVariant,
  Badge,
  Button,
  ToolbarItem,
} from "@patternfly/react-core";

import type { OrgRepresentation } from "./routes";
import { KeycloakDataTable } from "@/shared/keycloak-ui-shared";
import useOrgFetcher from "./useOrgFetcher";
import { useRealm } from "../../context/realm-context/RealmContext";
import { ListEmptyState } from "@/shared/keycloak-ui-shared";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { useTranslation } from "react-i18next";
import { useAlerts } from "@/shared/keycloak-ui-shared";

import { emptyFormatter } from "../../util";
import type { IRowData } from "@patternfly/react-table";
import { NewOrgRoleModal } from "./modals/NewOrgRoleModal";
import { EditOrgRoleModal } from "./modals/EditOrgRoleModal";

type OrgRolesProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

const defaultRoles = [
  "view-organization",
  "manage-organization",
  "view-members",
  "manage-members",
  "view-roles",
  "manage-roles",
  "view-invitations",
  "manage-invitations",
  "view-identity-providers",
  "manage-identity-providers",
];

export default function OrgRoles({ org, refresh: orgRefresh }: OrgRolesProps) {
  // Data Table
  const { realm } = useRealm();
  const { getRolesForOrg, deleteRoleFromOrg } = useOrgFetcher(realm);
  const { t } = useTranslation();
  const { addAlert } = useAlerts();

  const [key, setKey] = useState(0);
  const refresh = () => {
    setKey(new Date().getTime());
    orgRefresh();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loader = async (_first?: number, _max?: number, _search?: string) => {
    const roles = (await getRolesForOrg(org.id)) as RoleRepresentation[];
    // sort alphabetically
    // sort by the user defined (and editable) vs default ones
    return (
      roles
        // @ts-expect-error possibily undefined
        .sort((a, b) => a.name - b.name)
        .sort(
          (a, b) =>
            defaultRoles.indexOf(a.name!) - defaultRoles.indexOf(b.name!),
        )
    );
  };

  const [createRoleModalVisibility, setCreateRoleModalVisibility] =
    useState(false);
  const [editRoleModalVisibility, setEditRoleModalVisibility] = useState<
    RoleRepresentation | boolean
  >(false);

  // TODO: change this to a confirm dialog for the built in option
  async function deleteRole(role: RoleRepresentation): Promise<boolean> {
    if (
      !confirm(
        `Confirm you wish to remove role: ${role.name}. This cannot be undone.`,
      )
    ) {
      return Promise.resolve(true);
    }
    const resp = await deleteRoleFromOrg(org.id, role);
    if (resp.success) {
      addAlert(resp.message, AlertVariant.success);
      refresh();
    } else {
      addAlert(
        `${t("removeRoleFromOrgFail")} ${resp.message}`,
        AlertVariant.danger,
      );
    }

    return Promise.resolve(true);
  }

  return (
    <>
      <KeycloakDataTable
        data-testid="roles-org-table"
        key={`${org.id}${key}`}
        loader={loader}
        ariaLabelKey="invitations"
        isRowDisabled={(value) => {
          return defaultRoles.includes(value.name!);
        }}
        toolbarItem={
          <ToolbarItem>
            <Button
              data-testid="addInvitation"
              variant="primary"
              onClick={() => setCreateRoleModalVisibility(true)}
            >
              Create Role
            </Button>
          </ToolbarItem>
        }
        actionResolver={(rowData: IRowData) => [
          {
            title: t("editRole"),
            onClick: () => setEditRoleModalVisibility(rowData.data),
          },
          {
            title: t("deleteRoleAction"),
            onClick: () => deleteRole(rowData.data),
          },
        ]}
        columns={[
          {
            name: "name",
            displayKey: "name",
            cellRenderer: (role: RoleRepresentation) =>
              !defaultRoles.includes(role.name!) ? (
                <Button
                  key={role.id}
                  variant="link"
                  onClick={() => setEditRoleModalVisibility(role)}
                  size="sm"
                  isInline
                >
                  <Badge
                    isRead
                    className="keycloak-admin--role-mapping__client-name"
                  >
                    defined
                  </Badge>
                  {role.name}
                </Button>
              ) : (
                <div>
                  <Badge
                    key={role.id}
                    isRead
                    className="keycloak-admin--role-mapping__client-name"
                  >
                    default
                  </Badge>
                  {role.name}
                </div>
              ),
          },
          {
            name: "description",
            displayKey: "description",
            cellFormatters: [emptyFormatter()],
          },
        ]}
        emptyState={
          <ListEmptyState
            message="No Roles Found"
            instructions="There are currently no roles available for this organization."
            primaryActionText="Create Role"
            onPrimaryAction={() => setCreateRoleModalVisibility(true)}
          />
        }
      />
      {createRoleModalVisibility && (
        <NewOrgRoleModal
          orgId={org.id}
          handleModalToggle={() => setCreateRoleModalVisibility(false)}
          refresh={refresh}
        />
      )}
      {editRoleModalVisibility && (
        <EditOrgRoleModal
          orgId={org.id}
          role={editRoleModalVisibility as RoleRepresentation}
          handleModalToggle={() => setEditRoleModalVisibility(false)}
          refresh={refresh}
        />
      )}
    </>
  );
}
