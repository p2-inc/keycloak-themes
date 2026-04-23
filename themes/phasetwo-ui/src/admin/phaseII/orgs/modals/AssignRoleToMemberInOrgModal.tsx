import { useEffect, useState } from "react";
import {
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useAlerts } from "@/shared/keycloak-ui-shared";

import useOrgFetcher, {
  PhaseTwoOrganizationUserRepresentation,
} from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { differenceBy } from "lodash-es";
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  cellWidth,
} from "@patternfly/react-table";

type AssignRoleToMemberProps = {
  orgId: string;
  handleModalToggle: () => void;
  refresh: () => void;
  user: PhaseTwoOrganizationUserRepresentation;
  orgRoles: RoleRepresentation[];
};

export const AssignRoleToMemberModal = ({
  handleModalToggle,
  orgId,
  refresh,
  user,
  orgRoles,
}: AssignRoleToMemberProps) => {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { setOrgRoleForUser, listOrgRolesForUser, revokeOrgRoleForUser } =
    useOrgFetcher(realm);
  const { addAlert, addError } = useAlerts();

  const [key, setKey] = useState(0);
  const refreshRoles = () => setKey(key + 1);

  const [tableRows, setTableRows] = useState<
    { id: string; name: string; description?: string; selected: boolean }[]
  >([]);
  const [userOrgRoles, setUserOrgRoles] = useState<
    { id: string; name: string }[]
  >([]);

  const columns = [
    {
      name: "name",
    },
    {
      name: "description",
      displayKey: t("description"),
    },
    {
      name: "hasRole",
      displayKey: t("Has role?"),
      cellRenderer: (row: any) => {
        return userOrgRoles.find((or) => or.id === row.id) ? t("yes") : t("no");
      },
    },
  ];

  const saveRoles = async () => {
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
      return;
    }

    addAlert(
      `Updating roles. Granting ${newRoles.length} roles. Revoking ${rolesToRemove.length} roles.`,
    );

    try {
      await Promise.all(
        newRoles.map((newRole) => setOrgRoleForUser(orgId, newRole, user)),
      );
    } catch (e) {
      console.log("Error during assignment");
      addError("Error assigning roles.", e);
    }

    try {
      await Promise.all(
        rolesToRemove.map((roleToRemove) =>
          revokeOrgRoleForUser(orgId, roleToRemove, user),
        ),
      );
    } catch (e) {
      addError("Error removing roles.", e);
      console.log("Error during removal");
    }

    addAlert("Role assignments have been updated successfully.");
    refreshRoles();
  };

  const getListOrgRolesForUser = async () => {
    const getRolesForUser = await listOrgRolesForUser(orgId, user);

    if (getRolesForUser.error) {
      addError(
        `Error attempting to fetch available roles. Please refresh and try again.`,
        getRolesForUser,
      );

      return [];
    }

    setUserOrgRoles(getRolesForUser.data ?? []);

    return getRolesForUser.data ?? [];
  };

  const loader = async () => {
    const getRolesForUser = await getListOrgRolesForUser();
    const hasRoleIds = getRolesForUser.map((r) => r.id);

    const roleMap = orgRoles.map((orgRole) => {
      const isSelected = hasRoleIds.includes(orgRole.id ?? "");
      return {
        ...orgRole,
        selected: isSelected,
      };
    });

    // @ts-ignore
    setTableRows(roleMap);
    return roleMap;
  };

  useEffect(() => {
    loader();
  }, [key]);

  const closeModal = () => {
    refresh();
    handleModalToggle();
  };

  return (
    <Modal
      variant={ModalVariant.large}
      title={`${t("assignRoleAction")} to ${user.username || "user"}`}
      isOpen={true}
      onClose={closeModal}
      actions={[
        <Button
          data-testid={`assignRole`}
          key="confirm"
          variant="primary"
          type="submit"
          onClick={saveRoles}
        >
          {t("save")}
        </Button>,
        <Button
          id="modal-cancel"
          data-testid="cancel"
          key="cancel"
          variant={ButtonVariant.link}
          onClick={() => {
            closeModal();
          }}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      <Table aria-label="Assign roles to member table" variant="compact">
        <Thead>
          <Tr>
            <Th className={cellWidth(10)().className}>
              <input
                type="checkbox"
                name="selectAll"
                id="selectAll"
                checked={
                  tableRows.filter((r) => r.selected === true).length ===
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
            {columns.map((c) => (
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
                  onChange={(e) =>
                    setTableRows(
                      tableRows.map((r) => ({
                        ...r,
                        selected:
                          e.currentTarget.id === r.id
                            ? !r.selected
                            : r.selected,
                      })),
                    )
                  }
                />
              </Td>
              {columns.map((c) => (
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
    </Modal>
  );
};
