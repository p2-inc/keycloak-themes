import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Action, KeycloakDataTable } from "@/shared/keycloak-ui-shared";
import { ListEmptyState } from "@/shared/keycloak-ui-shared";
import { useRealm } from "../../context/realm-context/RealmContext";
import { AddMember } from "./AddMember";
import type { OrgRepresentation } from "./routes";
import useOrgFetcher, {
  PhaseTwoOrganizationUserRepresentation,
} from "./useOrgFetcher";
import { Button, ToolbarItem } from "@patternfly/react-core";
import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import { Link } from "react-router-dom";
import { toUser } from "../../user/routes/User";
import { AssignRoleToMemberModal } from "./modals/AssignRoleToMemberInOrgModal";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { ViewOrganizationUserAttributes } from "./modals/ViewUserOrganizationAttributes";

type OrgMembersTypeProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

const UserDetailLink = (
  user: PhaseTwoOrganizationUserRepresentation,
  realm: string,
) => (
  <Link key={user.id} to={toUser({ realm, id: user.id!, tab: "settings" })}>
    {user.username}
  </Link>
);

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
  const { getOrgMembers, removeMemberFromOrg, getRolesForOrg } =
    useOrgFetcher(realm);
  const [assignRoleModalOpen, setAssignRoleModalOpen] = useState<
    UserRepresentation | boolean
  >(false);
  const [viewUserOrganizationAttributes, setViewUserOrganizationAttributes] =
    useState<UserRepresentation | boolean>(false);

  const [orgRoles, setOrgRoles] = useState<RoleRepresentation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getRolesForOrg(org.id);
      setOrgRoles(data);
    };

    fetchData();
  }, []);

  const loader = async (
    first: number,
    max: number,
    search: string,
  ): Promise<PhaseTwoOrganizationUserRepresentation[]> =>
    await getOrgMembers(org.id, { first, max, search });

  const [addMembersVisibility, setAddMembersVisibility] = useState(false);
  const toggleAddMembersVisibility = () =>
    setAddMembersVisibility(!addMembersVisibility);

  return (
    <>
      {addMembersVisibility && (
        <AddMember
          refresh={refresh}
          orgId={org.id}
          onClose={toggleAddMembersVisibility}
        />
      )}
      {assignRoleModalOpen && (
        <AssignRoleToMemberModal
          orgId={org.id}
          user={assignRoleModalOpen as PhaseTwoOrganizationUserRepresentation}
          handleModalToggle={() => setAssignRoleModalOpen(false)}
          refresh={refresh}
          orgRoles={orgRoles}
        />
      )}
      {viewUserOrganizationAttributes && typeof viewUserOrganizationAttributes === "object" && (
        <ViewOrganizationUserAttributes
          userId={viewUserOrganizationAttributes.id}
          handleModalToggle={() => setViewUserOrganizationAttributes(false)}
          refresh={refresh}
          orgId={org.id}
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
        actions={[
          {
            title: t("assignRole"),
            onRowClick: async (user: UserRepresentation): Promise<boolean> => {
              setAssignRoleModalOpen(user);
              // open a modal
              // modal pulls in roles
              // allow selecting roles and assigning to the user
              return Promise.resolve(true);
            },
          } as Action<any>,
          {
            title: t("manageAttributes"),
            onRowClick: async (user: UserRepresentation): Promise<boolean> => {
              setViewUserOrganizationAttributes(user);
              // open a modal
              // only able to view current attributes from passed in user
              return Promise.resolve(true);
            },
          } as Action<any>,
          {
            title: t("removeMember"),
            onRowClick: async (user: UserRepresentation): Promise<boolean> => {
              await removeMemberFromOrg(org.id, user.id!);
              refresh();
              return Promise.resolve(true);
            },
          } as Action<any>,
        ]}
        columns={[
          {
            name: "username",
            displayKey: "Name",
            cellRenderer: (user: PhaseTwoOrganizationUserRepresentation) =>
              UserDetailLink(user, realm),
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
