import { PageSection, Tab, TabTitleText } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { ViewHeader } from "../../components/view-header/ViewHeader";
import helpUrls from "../../help-urls";
import {
  useRoutableTab,
  RoutableTabs,
} from "../../components/routable-tabs/RoutableTabs";
import { StylesTab, toStyles } from "./routes/Styles";
import { LoginStyles } from "./login/login-styles";
import { GeneralStyles } from "./general/general-styles";
import { EmailTemplate } from "./email/email-template";
import { PortalStyles } from "./portal/portal-styles";
import { KeycloakSpinner, useFetch } from "@/shared/keycloak-ui-shared";
import { useState } from "react";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useAdminClient } from "../../admin-client";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";

export default function StylesSection() {
  const { t } = useTranslation();
  const { adminClient } = useAdminClient();

  const { realm: realmName } = useRealm();
  const [realm, setRealm] = useState<RealmRepresentation>();

  const [key, setKey] = useState(0);

  const refresh = () => {
    setKey(key + 1);
  };

  useFetch(() => adminClient.realms.findOne({ realm: realmName }), setRealm, [
    key,
  ]);

  const useTab = (tab: StylesTab) =>
    useRoutableTab(toStyles({ realm: realmName, tab }));

  const generalTab = useTab("general");
  const loginTab = useTab("login");
  const emailTab = useTab("email");
  const portalTab = useTab("portal");

  if (!realm) {
    return <KeycloakSpinner />;
  }

  return (
    <>
      <ViewHeader
        titleKey={t("styles")}
        subKey={t("explain")}
        helpUrl={helpUrls.stylesUrl}
        divider={false}
      />
      <PageSection variant="light" className="pf-v5-u-p-0">
        <RoutableTabs
          mountOnEnter
          isBox
          defaultLocation={toStyles({
            realm: realmName,
            tab: "general",
          })}
        >
          <Tab
            data-testid="general"
            title={<TabTitleText>{t("general")}</TabTitleText>}
            {...generalTab}
          >
            <GeneralStyles refresh={refresh} realm={realm} />
          </Tab>
          <Tab
            data-testid="login"
            title={<TabTitleText>{t("login")}</TabTitleText>}
            {...loginTab}
          >
            <LoginStyles refresh={refresh} realm={realm} />
          </Tab>
          <Tab
            data-testid="email"
            title={<TabTitleText>{t("emails")}</TabTitleText>}
            {...emailTab}
          >
            <EmailTemplate realm={realm} refresh={refresh} />
          </Tab>
          <Tab
            data-testid="portal"
            title={<TabTitleText>{t("portal")}</TabTitleText>}
            {...portalTab}
          >
            <PortalStyles refresh={refresh} realm={realm} />
          </Tab>
        </RoutableTabs>
      </PageSection>
    </>
  );
}
