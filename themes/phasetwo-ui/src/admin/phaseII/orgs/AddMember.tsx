import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertVariant,
  Button,
  EmptyState,
  Modal,
  ModalVariant,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";

import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useAlerts } from "@/shared/keycloak-ui-shared";

import { KeycloakDataTable } from "@/shared/keycloak-ui-shared";
import { emptyFormatter } from "../../util";
import { toAddUser } from "../../user/routes/AddUser";
import useOrgFetcher from "./useOrgFetcher";
import { useAdminClient } from "../../admin-client";
import { UserLookup, UserLookupChips } from "../user/UserLookup";
import { buildUserLookupParams, type UserLookupFilter } from "../user/user-lookup";

type MemberModalProps = {
  orgId: string;
  refresh: () => void;
  onClose: () => void;
};

export const AddMember = ({ orgId, onClose, refresh }: MemberModalProps) => {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { isOrgMember, addOrgMember } = useOrgFetcher(realm);
  const { addAlert, addError } = useAlerts();
  const [selectedRows, setSelectedRows] = useState<UserRepresentation[]>([]);
  // Exact lookups only; nothing is listed until a user is looked up.
  const [filters, setFilters] = useState<UserLookupFilter[]>([]);
  const [key, setKey] = useState(0);
  const { adminClient } = useAdminClient();

  const navigate = useNavigate();

  const goToCreate = () => navigate(toAddUser({ realm }));

  const applyFilters = (next: UserLookupFilter[]) => {
    setFilters(next);
    setKey(key + 1);
  };

  const lookup = (
    <ToolbarItem style={{ flex: "1 1 28rem", minWidth: 0 }}>
      <UserLookup
        filters={filters}
        onChange={applyFilters}
        multi={false}
        showAttributes={false}
      />
    </ToolbarItem>
  );

  const loader = async (
    first?: number,
    max?: number,
  ): Promise<UserRepresentation[]> => {
    const lookupParams = buildUserLookupParams(filters);
    if (!lookupParams) return [];

    try {
      const users = await adminClient.users.find({
        first: first!,
        max: max!,
        briefRepresentation: true,
        ...lookupParams,
      });
      // An exact lookup returns a handful of users, so check each one's
      // membership rather than paging through every member of the org.
      const memberships = await Promise.all(
        users.map((user) => isOrgMember(orgId, user.id!)),
      );
      return users.filter((_, i) => !memberships[i]);
    } catch (error) {
      addError("groups:noUsersFoundError", error);
      return [];
    }
  };

  return (
    <Modal
      variant={ModalVariant.large}
      title={t("addMember")}
      isOpen={true}
      onClose={onClose}
      actions={[
        <Button
          data-testid="add"
          key="confirm"
          variant="primary"
          isDisabled={selectedRows.length === 0}
          onClick={async () => {
            try {
              await Promise.all(
                selectedRows.map(async (user) => {
                  await addOrgMember(orgId, user.id!);
                  refresh();
                }),
              );
              onClose();
              addAlert(
                t("usersAdded_other_org", { count: selectedRows.length }),
                AlertVariant.success,
              );
            } catch (error) {
              addError("usersAddedError_org", error);
            }
          }}
        >
          {t("add")}
        </Button>,
        <Button
          data-testid="cancel"
          key="cancel"
          variant="link"
          onClick={onClose}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      <KeycloakDataTable
        key={key}
        loader={loader}
        isPaginated
        ariaLabelKey="title"
        isSearching={filters.length !== 0}
        toolbarItem={lookup}
        subToolbar={
          <UserLookupChips filters={filters} onChange={applyFilters} />
        }
        canSelectAll
        onSelect={(rows: UserRepresentation[]) => setSelectedRows([...rows])}
        emptyState={
          <>
            <Toolbar>
              <ToolbarContent>{lookup}</ToolbarContent>
            </Toolbar>
            <EmptyState data-testid="empty-state" variant="lg">
              <TextContent>
                <Text>{t("userLookupAddMemberEmpty")}</Text>
              </TextContent>
              <Button variant="link" onClick={goToCreate}>
                {t("createNewUser")}
              </Button>
            </EmptyState>
          </>
        }
        columns={[
          {
            name: "username",
            displayKey: "username",
          },
          {
            name: "email",
            displayKey: "email",
          },
          {
            name: "lastName",
            displayKey: "lastName",
            cellFormatters: [emptyFormatter()],
          },
          {
            name: "firstName",
            displayKey: "firstName",
            cellFormatters: [emptyFormatter()],
          },
        ]}
      />
    </Modal>
  );
};
