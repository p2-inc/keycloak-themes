import { useEffect, useState } from "react";
import {
  PageSection,
  Tab,
  TabTitleText,
  DropdownItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useAlerts } from "@/shared/keycloak-ui-shared";

import useOrgFetcher from "./useOrgFetcher";
import type { OrgParams } from "./routes/Org";
import { ViewHeader } from "../../components/view-header/ViewHeader";
import helpUrls from "../../help-urls";
import OrgMembers from "./OrgMembers";
import OrgInvitations from "./OrgInvitations";
import OrgRoles from "./OrgRoles";
import { PortalLink } from "./components/portal-link/PortalLink";
import useToggle from "../../utils/useToggle";
import OrgIdentityProviders from "./OrgIdentityProviders";
import OrgSettings from "./OrgSettings";
import OrgAttributes from "./OrgAttributes";
import OrgDomains from "./OrgDomains";
import {
  RoutableTabs,
  useRoutableTab,
} from "../../components/routable-tabs/RoutableTabs";
import { toOrg, OrgTab } from "./routes/Org";

const tabHelpUrls: Record<OrgTab, string> = {
  settings: helpUrls.orgsUrl,
  domains: helpUrls.orgDomainsUrl,
  attributes: helpUrls.orgAttributesUrl,
  members: helpUrls.orgMembersUrl,
  invitations: helpUrls.orgInvitationsUrl,
  roles: helpUrls.orgRolesUrl,
  identityproviders: helpUrls.orgIdpsUrl,
};

export default function OrgDetails() {
  const { orgId, tab } = useParams<OrgParams>();
  const { t } = useTranslation();
  const { addError } = useAlerts();
  const [portalLinkOpen, togglePortalLinkOpen] = useToggle(false);
  const [key, setKey] = useState(0);

  const { realm } = useRealm();
  const { getOrg, org } = useOrgFetcher(realm);

  const refresh = () => {
    setKey(key + 1);
  };

  useEffect(() => {
    getOrg(orgId!).catch((e) => addError(t("errorFetching"), e));
  }, [key]);

  const useTab = (tab: OrgTab) =>
    useRoutableTab(
      toOrg({
        realm,
        orgId: orgId!,
        tab,
      }),
    );

  const settingsTab = useTab("settings");
  const domainsTab = useTab("domains");
  const attributesTab = useTab("attributes");
  const membersTab = useTab("members");
  const invitationsTab = useTab("invitations");
  const rolesTab = useTab("roles");
  const identityProvidersTab = useTab("identityproviders");

  if (!org) return <div></div>;

  const dropdownItems = [
    <DropdownItem key="download" onClick={togglePortalLinkOpen}>
      {t("generatePortalLink")}
    </DropdownItem>,
  ];

  return (
    <>
      <ViewHeader
        titleKey={org.displayName || org.name || org.id}
        divider={false}
        helpUrl={tab ? tabHelpUrls[tab] : helpUrls.orgsUrl}
        dropdownItems={dropdownItems}
      />
      <PortalLink
        id="id"
        open={portalLinkOpen}
        toggleDialog={togglePortalLinkOpen}
      />
      <PageSection variant="light" className="pf-v5-u p-0">
        <RoutableTabs data-testid="orgs-tabs" isBox mountOnEnter>
          <Tab
            id="settings"
            title={<TabTitleText>{t("settings")}</TabTitleText>}
            {...settingsTab}
          >
            <OrgSettings org={org} refresh={refresh} />
          </Tab>
          <Tab
            id="domains"
            title={<TabTitleText>Domains</TabTitleText>}
            {...domainsTab}
          >
            <OrgDomains org={org} refresh={refresh} />
          </Tab>
          <Tab
            id="attributes"
            title={<TabTitleText>Attributes</TabTitleText>}
            {...attributesTab}
          >
            <OrgAttributes org={org} refresh={refresh} />
          </Tab>
          <Tab
            id="members"
            title={<TabTitleText>Members</TabTitleText>}
            {...membersTab}
          >
            <OrgMembers org={org} refresh={refresh} />
          </Tab>
          <Tab
            id="invitations"
            title={<TabTitleText>Invitations</TabTitleText>}
            {...invitationsTab}
          >
            <OrgInvitations org={org} refresh={refresh} />
          </Tab>
          <Tab
            id="roles"
            title={<TabTitleText>Roles</TabTitleText>}
            {...rolesTab}
          >
            <OrgRoles org={org} refresh={refresh} />
          </Tab>
          <Tab
            id="identityproviders"
            title={<TabTitleText>Identity Providers</TabTitleText>}
            {...identityProvidersTab}
          >
            <OrgIdentityProviders org={org} refresh={refresh} />
          </Tab>
        </RoutableTabs>
      </PageSection>
    </>
  );
}
