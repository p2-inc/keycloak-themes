import { useState } from "react";
import { KeycloakDataTable } from "@/shared/keycloak-ui-shared";
import { useRealm } from "../../context/realm-context/RealmContext";
import type { OrgRepresentation } from "./routes";
import useOrgFetcher from "./useOrgFetcher";
import { Button, ToolbarItem, Tooltip } from "@patternfly/react-core";
import { ListEmptyState } from "@/shared/keycloak-ui-shared";
import AddInvitation from "./modals/AddInvitation";
import { useAlerts } from "@/shared/keycloak-ui-shared";
import { SyncAltIcon, TrashAltIcon } from "@patternfly/react-icons";

import { useTranslation } from "react-i18next";

type OrgInvitationsTypeProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

type OrgInvitationRepresentation = {
  id: string;
  email: string;
  createdAt?: number | string;
};

export default function OrgInvitations({
  org,
  refresh: refreshOrg,
}: OrgInvitationsTypeProps) {
  const { t } = useTranslation();
  // Table Refresh
  const [key, setKey] = useState(0);
  const refresh = () => {
    setKey(new Date().getTime());
    refreshOrg();
  };

  // Needed State
  const { realm } = useRealm();
  const { getOrgInvitations, deleteOrgInvitation, resendOrgInvitation } =
    useOrgFetcher(realm);
  const { addAlert, addError } = useAlerts();

  const loader = async () => {
    return await getOrgInvitations(org.id);
  };

  // Invite User Modal
  const [invitationModalVisibility, setInvitationModalVisibility] =
    useState(false);
  function toggleInvitationModalVisibility() {
    setInvitationModalVisibility(!invitationModalVisibility);
  }

  async function resendInvitation(
    row: OrgInvitationRepresentation,
  ): Promise<boolean> {
    try {
      await resendOrgInvitation(org.id, row.id);
      addAlert(t("organizationInvitationResent"));
      refresh();
      return true;
    } catch (error) {
      addError("organizationInvitationResendError", error);
      return false;
    }
  }

  async function removeInvitation(
    row: OrgInvitationRepresentation,
  ): Promise<boolean> {
    try {
      await deleteOrgInvitation(org.id, row.id);
      addAlert(t("organizationInvitationsDeleted", { count: 1 }));
      refresh();
      return true;
    } catch (error) {
      addError("organizationInvitationsDeleteError", error);
      return false;
    }
  }

  const InvitationActions = (invitation: OrgInvitationRepresentation) => (
    <div className="pf-v5-u-display-flex pf-v5-u-justify-content-flex-end pf-v5-u-gap-sm">
      <Tooltip content={t("resendInvitation")} entryDelay={500}>
        <Button
          variant="plain"
          aria-label={t("resendInvitation")}
          onClick={(event) => {
            event.stopPropagation();
            void resendInvitation(invitation);
          }}
        >
          <SyncAltIcon />
        </Button>
      </Tooltip>
      <Tooltip content={t("deleteInvitation")} entryDelay={500}>
        <Button
          variant="plain"
          isDanger
          aria-label={t("deleteInvitation")}
          onClick={(event) => {
            event.stopPropagation();
            void removeInvitation(invitation);
          }}
        >
          <TrashAltIcon />
        </Button>
      </Tooltip>
    </div>
  );

  return (
    <>
      {invitationModalVisibility && (
        <AddInvitation
          refresh={refresh}
          org={org}
          toggleVisibility={toggleInvitationModalVisibility}
        />
      )}
      <KeycloakDataTable
        data-testid="invitations-org-table"
        key={key}
        loader={loader}
        ariaLabelKey={t("invitations")}
        toolbarItem={
          <ToolbarItem>
            <Button
              data-testid="addInvitation"
              variant="primary"
              onClick={() => setInvitationModalVisibility(true)}
            >
              Invite User
            </Button>
          </ToolbarItem>
        }
        columns={[
          {
            name: "email",
            displayKey: "Email",
          },
          {
            name: "createdAt",
            displayKey: "Invited at",
            cellRenderer: (data: OrgInvitationRepresentation) => {
              if (!data.createdAt) {
                return <div>-</div>;
              }

              const date = new Date(data.createdAt);
              return <div>{date.toLocaleString()}</div>;
            },
          },
          {
            name: "actions",
            displayKey: "",
            cellRenderer: InvitationActions,
          },
        ]}
        emptyState={
          <ListEmptyState
            message="No Invitations Found"
            instructions="Please invite a user via email address to see a list of invitations"
            primaryActionText="Invite User"
            onPrimaryAction={() => setInvitationModalVisibility(true)}
          />
        }
      />
    </>
  );
}
