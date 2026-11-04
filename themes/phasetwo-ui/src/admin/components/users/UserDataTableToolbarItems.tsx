/**
 * This file has been claimed for ownership from @keycloakify/keycloak-admin-ui version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "admin/components/users/UserDataTableToolbarItems.tsx" --revert
 */

/* eslint-disable */

// @ts-nocheck

import type RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import type { UserProfileConfig } from "@keycloak/keycloak-admin-client/lib/defs/userProfileMetadata";
import {
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  ToolbarItem,
} from "../../../shared/@patternfly/react-core";
import { EllipsisVIcon } from "../../../shared/@patternfly/react-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../../context/access/Access";
import { UserLookup } from "../../phaseII/user/UserLookup";
import type { UserLookupFilter } from "../../phaseII/user/user-lookup";

type UserDataTableToolbarItemsProps = {
  realm: RealmRepresentation;
  hasSelectedRows: boolean;
  toggleDeleteDialog: () => void;
  toggleUnlockUsersDialog: () => void;
  goToCreate: () => void;
  filters: UserLookupFilter[];
  setFilters: (filters: UserLookupFilter[]) => void;
  profile: UserProfileConfig;
};

export function UserDataTableToolbarItems({
  realm,
  hasSelectedRows,
  toggleDeleteDialog,
  toggleUnlockUsersDialog,
  goToCreate,
  filters,
  setFilters,
  profile,
}: UserDataTableToolbarItemsProps) {
  const { t } = useTranslation();
  const [kebabOpen, setKebabOpen] = useState(false);

  const { hasAccess } = useAccess();

  // Only needs query-users access to attempt add/delete of users.
  // This is because the user could have fine-grained access to users
  // of a group.  There is no way to know this without searching the
  // permissions of every group.
  const isManager = hasAccess("query-users");

  // Phase Two: one exact-match lookup replaces the Default/Attribute search
  // modes, whose prefix and infix matching scan the whole user table.
  const searchItem = () => {
    return (
      <ToolbarItem style={{ flex: "1 1 32rem", minWidth: 0 }}>
        <UserLookup
          filters={filters}
          onChange={setFilters}
          profile={profile}
        />
      </ToolbarItem>
    );
  };

  const bruteForceProtectionToolbarItem = !realm.bruteForceProtected ? (
    <ToolbarItem>
      <Button
        variant={ButtonVariant.link}
        onClick={toggleDeleteDialog}
        data-testid="delete-user-btn"
        isDisabled={hasSelectedRows}
      >
        {t("deleteUser")}
      </Button>
    </ToolbarItem>
  ) : (
    <ToolbarItem>
      <Dropdown
        onOpenChange={(isOpen) => setKebabOpen(isOpen)}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            isExpanded={kebabOpen}
            variant="plain"
            onClick={() => setKebabOpen(!kebabOpen)}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        isOpen={kebabOpen}
        shouldFocusToggleOnSelect
      >
        <DropdownList>
          <DropdownItem
            key="deleteUser"
            component="button"
            isDisabled={hasSelectedRows}
            onClick={() => {
              toggleDeleteDialog();
              setKebabOpen(false);
            }}
          >
            {t("deleteUser")}
          </DropdownItem>

          <DropdownItem
            key="unlock"
            component="button"
            onClick={() => {
              toggleUnlockUsersDialog();
              setKebabOpen(false);
            }}
          >
            {t("unlockAllUsers")}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </ToolbarItem>
  );

  const actionItems = (
    <>
      <ToolbarItem>
        <Button data-testid="add-user" onClick={goToCreate}>
          {t("addUser")}
        </Button>
      </ToolbarItem>
      {bruteForceProtectionToolbarItem}
    </>
  );

  return (
    <>
      {searchItem()}
      {isManager ? actionItems : null}
    </>
  );
}
