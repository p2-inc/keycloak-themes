import { PageSection, ToolbarItem } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useRealm } from "../../context/realm-context/RealmContext";
import type { UserParams } from "../../user/routes/User";
import { useParams } from "../../utils/useParams";
import useOrgFetcher from "../orgs/useOrgFetcher";
import {
  Field,
  KeycloakDataTable,
  ListEmptyState,
} from "@/shared/keycloak-ui-shared";
import { useMemo, useState } from "react";
import { OrgRepresentation } from "../orgs/routes";
import { Link } from "react-router-dom";
import { toOrg } from "../orgs/routes/Org";
import { CubesIcon } from "@patternfly/react-icons";

const OrgNameCell = (row: OrgRepresentation) => {
  const { realm } = useRealm();
  return (
    <Link to={toOrg({ realm, orgId: row.id, tab: "members" })}>{row.name}</Link>
  );
};

export const UserOrgs = () => {
  const { id } = useParams<UserParams>();
  const { realm } = useRealm();
  const { t } = useTranslation();
  const [key] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const refresh = () => setKey((value) => value + 1);

  const { getOrgsForUser } = useOrgFetcher(realm);
  const loader = async () => await getOrgsForUser(id);

  const columns = useMemo(() => {
    const defaultColumns: Field<OrgRepresentation>[] = [
      {
        name: "name",
        displayKey: "Name",
        cellRenderer: OrgNameCell,
      },
      {
        name: "displayName",
        displayKey: "Display Name",
      },
      {
        name: "realm",
        displayKey: "Realm",
      },
    ];

    return defaultColumns;
  }, []);

  return (
    <PageSection variant="light" className="pf-v5-u-p-0">
      <KeycloakDataTable
        key={key}
        loader={loader}
        ariaLabelKey="titleUserOrganizations"
        searchTypeComponent={false}
        isSearching={false}
        toolbarItem={
          <ToolbarItem className="pf-v5-u-align-self-center">
            {t("usersOrganizationsTitle")}
          </ToolbarItem>
        }
        columns={columns}
        emptyState={
          <ListEmptyState
            hasIcon
            icon={CubesIcon}
            message={t("noOrgs")}
            instructions={t("noOrgsForUser")}
          />
        }
      />
    </PageSection>
  );
};
