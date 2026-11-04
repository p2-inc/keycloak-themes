/**
 * This file has been claimed for ownership from @keycloakify/keycloak-admin-ui version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "admin/components/users/UserDataTable.tsx" --revert
 */

/* eslint-disable */

// @ts-nocheck

import type { UserProfileConfig } from "@keycloak/keycloak-admin-client/lib/defs/userProfileMetadata";
import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import {
  KeycloakDataTable,
  KeycloakSpinner,
  ListEmptyState,
  useAlerts,
  useFetch,
} from "../../../shared/keycloak-ui-shared";
import {
  AlertVariant,
  Button,
  ButtonVariant,
  EmptyState,
  Label,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  Tooltip,
} from "../../../shared/@patternfly/react-core";
import {
  ExclamationCircleIcon,
  InfoCircleIcon,
  WarningTriangleIcon,
} from "../../../shared/@patternfly/react-icons";
import type { IRowData } from "../../../shared/@patternfly/react-table";
import { JSX, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAdminClient } from "../../admin-client";
import { fetchRealmInfo } from "../../context/auth/admin-ui-endpoint";
import { UiRealmInfo } from "../../context/auth/uiRealmInfo";
import { useRealm } from "../../context/realm-context/RealmContext";
import { toAddUser } from "../../user/routes/AddUser";
import { toUser } from "../../user/routes/User";
import { emptyFormatter } from "../../util";
import { useConfirmDialog } from "../confirm-dialog/ConfirmDialog";
import { BruteUser, findUsers } from "../role-mapping/resource";
import { UserDataTableToolbarItems } from "./UserDataTableToolbarItems";
import { NetworkError } from "@keycloak/keycloak-admin-client";
import { UserLookupChips } from "../../phaseII/user/UserLookup";
import {
  buildUserLookupParams,
  type UserLookupFilter,
} from "../../phaseII/user/user-lookup";

const UserDetailLink = (user: BruteUser) => {
  const { t } = useTranslation();
  const { realm } = useRealm();
  return (
    <>
      <Link to={toUser({ realm, id: user.id!, tab: "settings" })}>
        {user.username}
        <StatusRow user={user} />
      </Link>
      {user.attributes?.["is_temporary_admin"]?.[0] === "true" && (
        <Tooltip content={t("temporaryAdmin")}>
          <WarningTriangleIcon
            className="pf-v5-u-ml-sm"
            id="temporary-admin-label"
          />
        </Tooltip>
      )}
    </>
  );
};

type StatusRowProps = {
  user: BruteUser;
};

const StatusRow = ({ user }: StatusRowProps) => {
  const { t } = useTranslation();
  return (
    <>
      {!user.enabled && (
        <Label color="red" icon={<InfoCircleIcon />}>
          {t("disabled")}
        </Label>
      )}
      {user.bruteForceStatus?.disabled && (
        <Label color="orange" icon={<WarningTriangleIcon />}>
          {t("temporaryLocked")}
        </Label>
      )}
    </>
  );
};

const ValidatedEmail = (user: UserRepresentation) => {
  const { t } = useTranslation();
  return (
    <>
      {!user.emailVerified && (
        <Tooltip content={t("notVerified")}>
          <ExclamationCircleIcon className="keycloak__user-section__email-verified" />
        </Tooltip>
      )}{" "}
      {emptyFormatter()(user.email) as JSX.Element}
    </>
  );
};

export function UserDataTable() {
  const { adminClient } = useAdminClient();

  const { t } = useTranslation();
  const { addAlert, addError } = useAlerts();
  const { realm: realmName, realmRepresentation: realm } = useRealm();
  const navigate = useNavigate();
  const [uiRealmInfo, setUiRealmInfo] = useState<UiRealmInfo>({});
  const [selectedRows, setSelectedRows] = useState<UserRepresentation[]>([]);
  // Phase Two: exact-match filters only; see phaseII/user/user-lookup.ts.
  const [filters, setFilters] = useState<UserLookupFilter[]>([]);
  const [profile, setProfile] = useState<UserProfileConfig>({});

  const [key, setKey] = useState(0);
  const refresh = () => setKey(key + 1);

  useFetch(
    async () => {
      try {
        return await Promise.all([
          fetchRealmInfo(adminClient),
          adminClient.users.getProfile(),
        ]);
      } catch (error) {
        if (error instanceof NetworkError && error?.response?.status === 403) {
          // "User Profile" attributes not available for Users Attribute search, when admin user does not have view- or manage-realm realm-management role
          return [{}, {}] as [UiRealmInfo, UserProfileConfig];
        } else {
          throw error;
        }
      }
    },
    ([uiRealmInfo, profile]) => {
      setUiRealmInfo(uiRealmInfo);
      setProfile(profile);
    },
    [],
  );

  const loader = async (first?: number, max?: number) => {
    const lookup = buildUserLookupParams(filters);

    if (!listUsers && !lookup) {
      return [];
    }

    try {
      return await findUsers(adminClient, {
        briefRepresentation: true,
        first: first!,
        max: max!,
        ...lookup,
      });
    } catch (error) {
      if (uiRealmInfo.userProfileProvidersEnabled) {
        addError("noUsersFoundErrorStorage", error);
      } else {
        addError("noUsersFoundError", error);
      }
      return [];
    }
  };

  const [toggleUnlockUsersDialog, UnlockUsersConfirm] = useConfirmDialog({
    titleKey: "unlockAllUsers",
    messageKey: "unlockUsersConfirm",
    continueButtonLabel: "unlock",
    onConfirm: async () => {
      try {
        await adminClient.attackDetection.delAll();
        refresh();
        addAlert(t("unlockUsersSuccess"), AlertVariant.success);
      } catch (error) {
        addError("unlockUsersError", error);
      }
    },
  });

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: t("deleteConfirmUsers", {
      count: selectedRows.length,
      name: selectedRows[0]?.username,
    }),
    messageKey: t("deleteConfirmDialog", { count: selectedRows.length }),
    continueButtonLabel: "delete",
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      try {
        for (const user of selectedRows) {
          await adminClient.users.del({ id: user.id! });
        }
        setSelectedRows([]);
        clearAllFilters();
        addAlert(t("userDeletedSuccess"), AlertVariant.success);
      } catch (error) {
        addError("userDeletedError", error);
      }
    },
  });

  const goToCreate = () => navigate(toAddUser({ realm: realmName }));

  if (uiRealmInfo.userProfileProvidersEnabled === undefined || !realm) {
    return <KeycloakSpinner />;
  }

  //should *only* list users when no user federation is configured
  const listUsers = !uiRealmInfo.userProfileProvidersEnabled;

  const applyFilters = (next: UserLookupFilter[]) => {
    setFilters(next);
    refresh();
  };

  const clearAllFilters = () => applyFilters([]);

  const toolbar = () => {
    return (
      <UserDataTableToolbarItems
        realm={realm}
        hasSelectedRows={selectedRows.length === 0}
        toggleDeleteDialog={toggleDeleteDialog}
        toggleUnlockUsersDialog={toggleUnlockUsersDialog}
        goToCreate={goToCreate}
        filters={filters}
        setFilters={applyFilters}
        profile={profile}
      />
    );
  };

  const subtoolbar = () => {
    if (!filters.length) {
      return;
    }
    return (
      <div className="user-attribute-search-form-subtoolbar">
        <UserLookupChips filters={filters} onChange={applyFilters} />
      </div>
    );
  };

  return (
    <>
      <DeleteConfirm />
      <UnlockUsersConfirm />
      <KeycloakDataTable
        isSearching={filters.length !== 0}
        key={key}
        loader={loader}
        isPaginated
        ariaLabelKey="titleUsers"
        canSelectAll
        onSelect={(rows: UserRepresentation[]) => setSelectedRows([...rows])}
        emptyState={
          !listUsers ? (
            <>
              <Toolbar>
                <ToolbarContent>{toolbar()}</ToolbarContent>
              </Toolbar>
              <EmptyState data-testid="empty-state" variant="lg">
                <TextContent className="kc-search-users-text">
                  <Text>{t("searchForUserDescription")}</Text>
                </TextContent>
              </EmptyState>
            </>
          ) : (
            <ListEmptyState
              message={t("noUsersFound")}
              instructions={t("emptyInstructions")}
              primaryActionText={t("createNewUser")}
              onPrimaryAction={goToCreate}
            />
          )
        }
        toolbarItem={toolbar()}
        subToolbar={subtoolbar()}
        actionResolver={(rowData: IRowData) => [
          {
            title: t("delete"),
            onClick: () => {
              setSelectedRows([rowData.data]);
              toggleDeleteDialog();
            },
          },
        ]}
        isRowDisabled={(user: UserRepresentation) => !user.access?.manage}
        columns={[
          {
            name: "username",
            displayKey: "username",
            cellRenderer: UserDetailLink,
          },
          {
            name: "email",
            displayKey: "email",
            cellRenderer: ValidatedEmail,
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
    </>
  );
}
