import { useState } from "react";
import { useTranslation } from "react-i18next";

import { KeycloakDataTable } from "@/shared/keycloak-ui-shared";
import { ListEmptyState } from "@/shared/keycloak-ui-shared";
import { useRealm } from "../../context/realm-context/RealmContext";
import { AddMember } from "./AddMember";
import type { OrgRepresentation } from "./routes";
import useOrgFetcher, {
  PhaseTwoOrganizationUserRepresentation,
} from "./useOrgFetcher";
import { Button, ButtonVariant, ToolbarItem } from "@patternfly/react-core";
import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import { Link } from "react-router-dom";
import { toOrgMember } from "./routes/OrgMember";
import { TrashAltIcon } from "@patternfly/react-icons";
import { useConfirmDialog } from "../../components/confirm-dialog/ConfirmDialog";

type OrgMembersTypeProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

export default function OrgMembers({
  org,
  refresh: refreshOrg,
}: OrgMembersTypeProps) {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const [key, setKey] = useState(0);
  const refresh = () => {
    setKey(new Date().getTime());
    refreshOrg();
  };
  const { getOrgMembers, removeMemberFromOrg } = useOrgFetcher(realm);
  const [memberToRemove, setMemberToRemove] =
    useState<UserRepresentation | null>(null);

  const [addMembersVisibility, setAddMembersVisibility] = useState(false);
  const toggleAddMembersVisibility = () =>
    setAddMembersVisibility(!addMembersVisibility);

  const [toggleRemoveDialog, RemoveConfirm] = useConfirmDialog({
    titleKey: "removeMemberConfirmTitle",
    messageKey: "removeMemberConfirm",
    continueButtonLabel: "remove",
    onConfirm: async () => {
      if (memberToRemove?.id) {
        await removeMemberFromOrg(org.id, memberToRemove.id);
        refresh();
      }
    },
  });

  const loader = async (
    first: number,
    max: number,
    search: string,
  ): Promise<PhaseTwoOrganizationUserRepresentation[]> =>
    await getOrgMembers(org.id, { first, max, search });

  const MemberLink = (user: PhaseTwoOrganizationUserRepresentation) => (
    <Link
      key={user.id}
      to={toOrgMember({ realm, orgId: org.id, userId: user.id!, tab: "roles" })}
    >
      {user.username}
    </Link>
  );

  const RemoveButton = (user: UserRepresentation) => (
    <Button
      variant={ButtonVariant.plain}
      isDanger
      aria-label={t("removeMember")}
      onClick={(e) => {
        e.stopPropagation();
        setMemberToRemove(user);
        toggleRemoveDialog();
      }}
      icon={<TrashAltIcon />}
    />
  );

  return (
    <>
      <RemoveConfirm />
      {addMembersVisibility && (
        <AddMember
          refresh={refresh}
          orgId={org.id}
          onClose={toggleAddMembersVisibility}
        />
      )}
      <KeycloakDataTable
        data-testid="members-org-table"
        isPaginated
        isSearching
        key={key}
        //@ts-ignore
        loader={loader}
        ariaLabelKey={t("members")}
        searchPlaceholderKey={t("search")}
        toolbarItem={
          <ToolbarItem>
            <Button
              data-testid="addMember"
              variant="primary"
              onClick={toggleAddMembersVisibility}
            >
              Add Member
            </Button>
          </ToolbarItem>
        }
        columns={[
          {
            name: "username",
            displayKey: "Name",
            cellRenderer: (user: PhaseTwoOrganizationUserRepresentation) =>
              MemberLink(user),
          },
          {
            name: "email",
            displayKey: "Email",
          },
          {
            name: "firstName",
            displayKey: "First Name",
          },
          {
            name: "lastName",
            displayKey: "Last Name",
          },
          {
            name: "",
            displayKey: "",
            cellRenderer: (user: UserRepresentation) => RemoveButton(user),
          },
        ]}
        emptyState={
          <ListEmptyState
            message={t("noUsersFound")}
            instructions={t("emptyInstructions")}
            primaryActionText={t("addMember")}
            onPrimaryAction={toggleAddMembersVisibility}
          />
        }
      />
    </>
  );
}
