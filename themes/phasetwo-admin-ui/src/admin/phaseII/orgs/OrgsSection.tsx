import { useState } from "react";
import {
  PageSection,
  ToolbarItem,
  Button,
  AlertVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ViewHeader } from "../../components/view-header/ViewHeader";
import helpUrls from "../../help-urls";
import useOrgFetcher from "./useOrgFetcher";
import { KeycloakDataTable } from "@/shared/keycloak-ui-shared";
import { ListEmptyState } from "@/shared/keycloak-ui-shared";
import { NewOrgModal } from "./modals/NewOrgModal";
import { toOrg } from "./routes/Org";
import { useRealm } from "../../context/realm-context/RealmContext";
import type { OrgRepresentation } from "./routes";
import { useAlerts } from "@/shared/keycloak-ui-shared";

import { ManageOrgSettingsDialog } from "./modals/ManageOrgSettingsDialog";

export default function OrgsSection() {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { refreshOrgs, deleteOrg: deleteOrgApi } = useOrgFetcher(realm);
  const { addAlert } = useAlerts();

  const [key, setKey] = useState(0);
  const refresh = () => setKey(new Date().getTime());
  const loader = async (first: number, max: number, search: string) =>
    await refreshOrgs(first, max, search);

  const [createOrgModalVisibility, setCreateOrgModalVisibility] =
    useState(false);
  const [manageOrgSettingsDialog, setManageOrgSettingsDialog] = useState(false);

  function toggleCreateModalVisibility() {
    setCreateOrgModalVisibility(!createOrgModalVisibility);
  }

  function emptyVal(val: string) {
    return val ? <div>{val}</div> : <div>--</div>;
  }

  const deleteOrg = async (org: OrgRepresentation) => {
    if (
      !confirm(
        `Confirm you wish to remove Organization: ${org.name}. This cannot be undone.`,
      )
    ) {
      return Promise.resolve(true);
    }
    const resp = await deleteOrgApi(org);
    if (resp.success) {
      addAlert(resp.message, AlertVariant.success);
    } else {
      addAlert(
        `${t("couldNotDeleteOrg")} ${resp.message}`,
        AlertVariant.danger,
      );
    }
    refresh();
    return Promise.resolve(true);
  };

  return (
    <>
      <ViewHeader
        titleKey={t("orgList")}
        subKey={t("orgExplain")}
        helpUrl={helpUrls.orgsUrl}
      />
      {manageOrgSettingsDialog && (
        <ManageOrgSettingsDialog
          onClose={() => {
            setManageOrgSettingsDialog(false);
            refresh();
          }}
        />
      )}
      <PageSection variant="light" className="pf-v5-u-p-0 pf-v5-u-pt-lg">
        <KeycloakDataTable
          key={key}
          isPaginated
          isSearching
          //@ts-ignore
          loader={loader}
          ariaLabelKey={t("orgList")}
          searchPlaceholderKey={t("searchForOrg")}
          toolbarItem={
            <>
              <ToolbarItem>
                <Button
                  data-testid="openCreateOrgModal"
                  variant="primary"
                  onClick={toggleCreateModalVisibility}
                >
                  {t("createOrg")}
                </Button>
              </ToolbarItem>

              <ToolbarItem>
                <Button
                  data-testid="managedOrgSettings"
                  variant="link"
                  onClick={() => setManageOrgSettingsDialog(true)}
                >
                  {t("manageSettings")}
                </Button>
              </ToolbarItem>
            </>
          }
          //@ts-ignore
          actions={[
            {
              title: "Delete organization",
              //@ts-ignore
              onRowClick: deleteOrg,
            },
          ]}
          columns={[
            {
              name: "name",
              displayKey: "Name",
              cellRenderer: (org: OrgRepresentation) =>
                org.name ? (
                  <Link
                    key={org.id}
                    to={toOrg({
                      realm,
                      orgId: org.id as string,
                      tab: "settings",
                    })}
                  >
                    {org.name}
                  </Link>
                ) : (
                  <div>--</div>
                ),
            },
            {
              name: "displayName",
              displayKey: "Display Name",
              cellRenderer: (org: OrgRepresentation) =>
                emptyVal(org.displayName),
            },
          ]}
          emptyState={
            <ListEmptyState
              hasIcon={true}
              message={t("noOrgsInThisRealm")}
              instructions={t("noOrgsInThisRealmInstructions")}
              primaryActionText={t("createOrg")}
              onPrimaryAction={toggleCreateModalVisibility}
            />
          }
        />
      </PageSection>
      {createOrgModalVisibility && (
        <NewOrgModal
          refresh={refresh}
          toggleVisibility={toggleCreateModalVisibility}
        />
      )}
    </>
  );
}
