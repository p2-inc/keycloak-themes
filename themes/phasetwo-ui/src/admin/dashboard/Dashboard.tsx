/**
 * This file has been claimed for ownership from @keycloakify/keycloak-admin-ui version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "admin/dashboard/Dashboard.tsx" --revert
 */

import FeatureRepresentation, {
  FeatureType,
} from "@keycloak/keycloak-admin-client/lib/defs/featureRepresentation";
import {
  HelpItem,
  label,
  useEnvironment,
} from "../../shared/keycloak-ui-shared";
import type { Environment } from "../environment";
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Label,
  List,
  ListItem,
  ListVariant,
  PageSection,
  Tab,
  TabTitleText,
  Text,
  TextContent,
  TextVariants,
} from "../../shared/@patternfly/react-core";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { KeycloakSpinner } from "../../shared/keycloak-ui-shared";
import {
  RoutableTabs,
  useRoutableTab,
} from "../components/routable-tabs/RoutableTabs";
import { useRealm } from "../context/realm-context/RealmContext";
import { useServerInfo } from "../context/server-info/ServerInfoProvider";
import useLocaleSort, { mapByKey } from "../utils/useLocaleSort";
import { ProviderInfo } from "./ProviderInfo";
import { DashboardTab, toDashboard } from "./routes/Dashboard";
import { AuthFlowsSummary } from "../phaseII/dashboard/AuthFlowsSummary";
import { RealmStatCards } from "../phaseII/dashboard/RealmStatCards";
import { useDashboardStats } from "../phaseII/dashboard/useDashboardStats";

import "./dashboard.css";
import "../phaseII/dashboard/dashboard-stats.css";

type FeatureItemProps = {
  feature: FeatureRepresentation;
};

const FeatureItem = ({ feature }: FeatureItemProps) => {
  const { t } = useTranslation();
  return (
    <ListItem className="pf-v5-u-mb-sm">
      {feature.name}&nbsp;
      {feature.type === FeatureType.Experimental && (
        <Label color="orange">{t("experimental")}</Label>
      )}
      {feature.type === FeatureType.Preview && (
        <Label color="blue">{t("preview")}</Label>
      )}
      {feature.type === FeatureType.PreviewDisabledByDefault && (
        <Label color="blue">{t("preview")}</Label>
      )}
      {feature.type === FeatureType.Default && (
        <Label color="green">{t("supported")}</Label>
      )}
      {feature.type === FeatureType.DisabledByDefault && (
        <Label color="green">{t("supported")}</Label>
      )}
      {feature.type === FeatureType.Deprecated && (
        <Label color="grey">{t("deprecated")}</Label>
      )}
    </ListItem>
  );
};

const RealmDashboard = () => {
  const { realm, realmRepresentation: realmInfo } = useRealm();
  const { stats } = useDashboardStats();
  const realmDisplayName = label(
    useTranslation().t,
    realmInfo?.displayName,
    realm,
  );

  return (
    <PageSection variant="light">
      <TextContent className="pf-v5-u-mb-lg">
        <Text component={TextVariants.h1}>{realmDisplayName}</Text>
      </TextContent>
      <RealmStatCards stats={stats} />
      <div className="pf-v5-u-mt-lg">
        <AuthFlowsSummary />
      </div>
    </PageSection>
  );
};

const ServerInfoDashboard = () => {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const serverInfo = useServerInfo();
  const localeSort = useLocaleSort();

  const sortedFeatures = useMemo(
    () => localeSort(serverInfo.features ?? [], mapByKey("name")),
    [serverInfo.features],
  );

  const disabledFeatures = useMemo(
    () => sortedFeatures.filter((f) => !f.enabled) || [],
    [sortedFeatures],
  );

  const enabledFeatures = useMemo(
    () => sortedFeatures.filter((f) => f.enabled) || [],
    [sortedFeatures],
  );

  const useTab = (tab: DashboardTab) =>
    useRoutableTab(toDashboard({ realm, tab }));

  const infoTab = useTab("info");
  const providersTab = useTab("providers");

  if (Object.keys(serverInfo).length === 0) {
    return <KeycloakSpinner />;
  }

  return (
    <PageSection variant="light" className="pf-v5-u-p-0">
      <RoutableTabs
        data-testid="dashboard-tabs"
        defaultLocation={toDashboard({ realm, tab: "info" })}
        isBox
        mountOnEnter
      >
        <Tab
          id="info"
          data-testid="infoTab"
          title={<TabTitleText>{t("serverInfo")}</TabTitleText>}
          {...infoTab}
        >
          <PageSection variant="light">
            <Grid hasGutter>
              <GridItem lg={2} sm={12}>
                <Card className="keycloak__dashboard_card">
                  <CardTitle>{t("serverInfo")}</CardTitle>
                  <CardBody>
                    <DescriptionList>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          {t("version")}
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {serverInfo.systemInfo?.version}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                  <CardTitle>{t("cpu")}</CardTitle>
                  <CardBody>
                    <DescriptionList>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          {t("processorCount")}
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {serverInfo.cpuInfo?.processorCount}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                  <CardTitle>{t("memory")}</CardTitle>
                  <CardBody>
                    <DescriptionList>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          {t("totalMemory")}
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {serverInfo.memoryInfo?.totalFormated}
                        </DescriptionListDescription>
                        <DescriptionListTerm>
                          {t("freeMemory")}
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {serverInfo.memoryInfo?.freeFormated}
                        </DescriptionListDescription>
                        <DescriptionListTerm>
                          {t("usedMemory")}
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {serverInfo.memoryInfo?.usedFormated}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </GridItem>
              <GridItem lg={10} sm={12}>
                <Card className="keycloak__dashboard_card">
                  <CardTitle>{t("profile")}</CardTitle>
                  <CardBody>
                    <DescriptionList>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          {t("enabledFeatures")}{" "}
                          <HelpItem
                            fieldLabelId="enabledFeatures"
                            helpText={t("infoEnabledFeatures")}
                          />
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          <List variant={ListVariant.inline}>
                            {enabledFeatures.map((feature) => (
                              <FeatureItem
                                key={feature.name}
                                feature={feature}
                              />
                            ))}
                          </List>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          {t("disabledFeatures")}{" "}
                          <HelpItem
                            fieldLabelId="disabledFeatures"
                            helpText={t("infoDisabledFeatures")}
                          />
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          <List variant={ListVariant.inline}>
                            {disabledFeatures.map((feature) => (
                              <FeatureItem
                                key={feature.name}
                                feature={feature}
                              />
                            ))}
                          </List>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </PageSection>
        </Tab>
        <Tab
          id="providers"
          data-testid="providersTab"
          title={<TabTitleText>{t("providerInfo")}</TabTitleText>}
          {...providersTab}
        >
          <ProviderInfo />
        </Tab>
      </RoutableTabs>
    </PageSection>
  );
};

export default function DashboardSection() {
  const { realm } = useRealm();
  const { environment } = useEnvironment<Environment>();
  const isMasterRealm = realm === environment.masterRealm;

  return (
    <>
      <RealmDashboard />
      {isMasterRealm && <ServerInfoDashboard />}
    </>
  );
}
