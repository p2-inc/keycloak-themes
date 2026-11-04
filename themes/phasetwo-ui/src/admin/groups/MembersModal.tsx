/**
 * This file has been claimed for ownership from @keycloakify/keycloak-admin-ui version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "admin/groups/MembersModal.tsx" --revert
 */

/* eslint-disable */

// @ts-nocheck

import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import {
  Button,
  EmptyState,
  Label,
  Modal,
  ModalVariant,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "../../shared/@patternfly/react-core";
import { InfoCircleIcon } from "../../shared/@patternfly/react-icons";
import { differenceBy } from "lodash-es";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminClient } from "../admin-client";
import { useAlerts } from "../../shared/keycloak-ui-shared";
import { KeycloakDataTable } from "../../shared/keycloak-ui-shared";
import { emptyFormatter } from "../util";
import { UserLookup, UserLookupChips } from "../phaseII/user/UserLookup";
import {
  buildUserLookupParams,
  type UserLookupFilter,
} from "../phaseII/user/user-lookup";

type MemberModalProps = {
  membersQuery: (first?: number, max?: number) => Promise<UserRepresentation[]>;
  onAdd: (users: UserRepresentation[]) => Promise<void>;
  onClose: () => void;
};

const UserDetail = (user: UserRepresentation) => {
  const { t } = useTranslation();
  return (
    <>
      {user.username}{" "}
      {!user.enabled && (
        <Label color="red" icon={<InfoCircleIcon />}>
          {t("disabled")}
        </Label>
      )}
    </>
  );
};

export const MemberModal = ({
  membersQuery,
  onAdd,
  onClose,
}: MemberModalProps) => {
  const { adminClient } = useAdminClient();

  const { t } = useTranslation();
  const { addError } = useAlerts();
  const [selectedRows, setSelectedRows] = useState<UserRepresentation[]>([]);
  // Phase Two: exact lookups only; nothing is listed until a user is looked up.
  const [filters, setFilters] = useState<UserLookupFilter[]>([]);
  const [key, setKey] = useState(0);

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

  const loader = async (first?: number, max?: number) => {
    const lookupParams = buildUserLookupParams(filters);
    if (!lookupParams) return [];

    const members = await membersQuery(first, max);
    const params: { [name: string]: string | number } = {
      first: first!,
      max: max! + members.length,
      ...lookupParams,
    };

    try {
      const users = await adminClient.users.find({ ...params });
      return differenceBy(users, members, "id").slice(0, max);
    } catch (error) {
      addError("noUsersFoundError", error);
      return [];
    }
  };

  return (
    <Modal
      variant={ModalVariant.large}
      title={t("addMember")}
      isOpen
      onClose={onClose}
      actions={[
        <Button
          data-testid="add"
          key="confirm"
          variant="primary"
          onClick={async () => {
            await onAdd(selectedRows);
            onClose();
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
        ariaLabelKey="titleUsers"
        isSearching={filters.length !== 0}
        toolbarItem={lookup}
        subToolbar={
          <UserLookupChips filters={filters} onChange={applyFilters} />
        }
        canSelectAll
        onSelect={(rows) => setSelectedRows([...rows])}
        emptyState={
          <>
            <Toolbar>
              <ToolbarContent>{lookup}</ToolbarContent>
            </Toolbar>
            <EmptyState data-testid="empty-state" variant="lg">
              <TextContent>
                <Text>{t("userLookupAddMemberEmpty")}</Text>
              </TextContent>
            </EmptyState>
          </>
        }
        columns={[
          {
            name: "username",
            displayKey: "username",
            cellRenderer: UserDetail,
          },
          {
            name: "email",
            displayKey: "email",
            cellFormatters: [emptyFormatter()],
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
