/* eslint-disable @typescript-eslint/no-unused-vars */

import { useAlerts } from "@/shared/keycloak-ui-shared";
import {
  AlertVariant,
  Button,
  Card,
  CardBody,
  CardTitle,
  Chip,
  Title,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  PencilAltIcon,
  StopCircleIcon,
  TrashIcon,
} from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { first } from "lodash-es";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";
import IdentityProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import { useRealm } from "../../context/realm-context/RealmContext";
import { FormattedLink } from "../../components/external-link/FormattedLink";
import helpUrls from "../../help-urls";
import { toIdentityProvider } from "../../identity-providers/routes/IdentityProvider";
import { AssignIdentityProvider } from "./modals/AssignIdentityProvider";
import EditIdentityProviderHomeIdpDomains from "./modals/EditIdentityProviderHomeIdpDomains";
import type { OrgRepresentation } from "./routes";
import useOrgFetcher from "./useOrgFetcher";

export type SyncMode = "FORCE" | "IMPORT" | "LEGACY";
export interface idpRep extends IdentityProviderRepresentation {
  syncMode?: SyncMode;
}

type OrgIdentityProvidersProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

export interface AlertInfo {
  title: string;
  variant: AlertVariant;
  key: number;
}

export default function OrgIdentityProviders({
  org,
  refresh,
}: OrgIdentityProvidersProps) {
  const { realm } = useRealm();
  const { linkIDPtoOrg, getIdpsForOrg, getIdpsForRealm, unlinkIDPtoOrg } =
    useOrgFetcher(realm);
  const { t } = useTranslation();
  const [orgIdps, setOrgIdps] = useState<IdentityProviderRepresentation[]>([]);
  const [idps, setIdps] = useState<idpRep[]>([]);
  const [idpToEdit, setIdpToEdit] = useState<IdentityProviderRepresentation>();

  const [enabledIdP, setEnabledIdP] = useState<idpRep>();
  const { addAlert } = useAlerts();

  const [showAssignIdpModal, setShowAssignIdpModal] = useState<boolean>();

  async function getIDPs() {
    const identityProviders = (await getIdpsForRealm({
      first: 0,
      max: 10,
    })) as idpRep[];
    setIdps(identityProviders);
  }

  async function fetchOrgIdps() {
    const orgIdps = await getIdpsForOrg(org.id);
    if ("error" in orgIdps && orgIdps.error) {
      console.error("Error fetching org IdPs", orgIdps.error);
      return;
    }
    setOrgIdps(orgIdps as IdentityProviderRepresentation[]);

    if (Array.isArray(orgIdps) && orgIdps.length > 0) {
      const activeIdP = first(orgIdps);

      if (
        activeIdP?.config?.["home.idp.discovery.org"].includes(org.id) &&
        activeIdP.enabled
      ) {
        setEnabledIdP(activeIdP);
      }
    }
  }

  const refreshIdPs = () => {
    getIDPs();
    fetchOrgIdps();
  };

  useEffect(() => {
    refreshIdPs();
  }, []);

  const assignIdentityProvider = async ({
    identityProvider,
    idpConfig,
  }: {
    identityProvider: IdentityProviderRepresentation;
    idpConfig: { syncMode: SyncMode; postBrokerLoginFlowAlias: string };
  }) => {
    try {
      const resp = await linkIDPtoOrg(org.id, {
        alias: identityProvider.alias!,
        post_broker_flow: idpConfig.postBrokerLoginFlowAlias,
        sync_mode: idpConfig.syncMode,
      });
      if (resp!.error) {
        throw new Error("Failed to update new IdP.");
      }
      addAlert(t("orgIdpAssignedSuccess"));
      setShowAssignIdpModal(false);
    } catch (e) {
      console.log("Error during IdP assignment", e);
      addAlert(t("orgIdpFailedAssignment"), AlertVariant.danger);
    } finally {
      refresh();
      refreshIdPs();
    }
  };

  const unassignIdentityProvider = async (idpAlias: string) => {
    try {
      const resp = await unlinkIDPtoOrg(org.id, idpAlias);
      if (resp!.error) {
        throw new Error("Failed to unassign IdP.");
      }
      addAlert(t("orgIdpUnassignedSuccess"));
    } catch (e) {
      console.log("Error during IdP unassignment", e);
      addAlert(t("orgIdpFailedUnassignment"), AlertVariant.danger);
    } finally {
      setEnabledIdP(undefined);
      refresh();
      refreshIdPs();
    }
  };

  let body = (
    <Card isFlat>
      <CardTitle>
        <Title headingLevel="h4" size="lg">
          {t("noIDPsAvailable")}
        </Title>
      </CardTitle>
      <CardBody>
        <NavLink to={`/${realm}/identity-providers`}>
          <Button variant="primary" ouiaId="Primary">
            Add Identity Provider
          </Button>
        </NavLink>
      </CardBody>
    </Card>
  );

  const tableHeaders = [
    { title: t("alias"), key: "alias" },
    { title: t("displayName"), key: "displayName" },
    { title: t("providerId"), key: "providerId" },
    { title: t("enabled"), key: "enabled" },
    {
      title: t("orgIdpAssignedDomains"),
      key: "config[home.idp.discovery.domains]",
    },
    {
      title: "actions",
      props: { className: "pf-v5-u-text-align-right pf-v5-u-display-none" },
    },
  ];

  if (idps.length > 0) {
    body = (
      <div>
        <Card isFlat>
          {enabledIdP ? (
            <>
              <CardTitle>
                <Title headingLevel="h4" size="lg">
                  {t("idpAssignedToOrg")}
                </Title>
              </CardTitle>
              <CardBody>
                <Table variant="compact" borders={false}>
                  <Thead>
                    <Tr>
                      {tableHeaders.map((header, idx) => (
                        <Th key={idx} {...header.props}>
                          {header.title}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {orgIdps.map((idp, rowIndex) => (
                      <Tr key={rowIndex}>
                        <Td dataLabel={tableHeaders[0].title}>
                          <Link
                            to={toIdentityProvider({
                              realm,
                              providerId: idp.providerId!,
                              alias: idp.alias!,
                              tab: "settings",
                            })}
                          >
                            {idp.alias}
                          </Link>
                        </Td>
                        <Td dataLabel={tableHeaders[1].title}>
                          {idp.displayName || "--"}
                        </Td>
                        <Td dataLabel={tableHeaders[2].title}>
                          {idp.providerId || "--"}
                        </Td>
                        <Td dataLabel={tableHeaders[3].title}>
                          {idp.enabled ? (
                            <CheckCircleIcon />
                          ) : (
                            <StopCircleIcon />
                          )}
                        </Td>
                        <Td dataLabel={tableHeaders[4].title}>
                          <div className="pf-v5-u-display-flex pf-v5-u-align-items-center">
                            {idp.config?.["home.idp.discovery.domains"]
                              ?.split("##")
                              .map((domain: string) => (
                                <Chip
                                  key={domain}
                                  isReadOnly
                                  className="pf-v5-u-mr-xs"
                                >
                                  {domain}
                                </Chip>
                              )) || t("any")}
                            <Button
                              variant="plain"
                              onClick={() => setIdpToEdit(idp)}
                              title={t("idpEdit")}
                            >
                              <PencilAltIcon />
                            </Button>
                          </div>
                        </Td>
                        <Td
                          dataLabel={tableHeaders[5].title}
                          className="pf-v5-u-text-align-right"
                        >
                          <Button
                            variant="plain"
                            onClick={() => unassignIdentityProvider(idp.alias!)}
                            title={t("idpUnassign")}
                          >
                            <TrashIcon />
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </>
          ) : (
            <CardBody className="pf-v5-u-pt-lg">{t("noIDPAssigned")}</CardBody>
          )}
        </Card>
        <div className="pf-v5-u-mt-lg">
          <Button
            data-testid="assign"
            variant="primary"
            onClick={() => setShowAssignIdpModal(true)}
          >
            {t("assignNewIdpShort")}
          </Button>
          {showAssignIdpModal && (
            <AssignIdentityProvider
              onSelect={(identityProvider, idpConfig) => {
                assignIdentityProvider({
                  identityProvider,
                  idpConfig: {
                    ...idpConfig,
                    postBrokerLoginFlowAlias:
                      idpConfig.postBrokerLoginFlowAlias || "",
                  },
                });
              }}
              onClear={() => setShowAssignIdpModal(false)}
              organization={org}
            />
          )}
        </div>
        <EditIdentityProviderHomeIdpDomains
          idp={idpToEdit}
          org={org}
          onClear={() => {
            setIdpToEdit(undefined);
            refreshIdPs();
          }}
        />
      </div>
    );
  }

  return (
    <div className="pf-v5-u-p-lg">
      <div className="pf-v5-u-mb-md">
        <FormattedLink
          title={t("learnMore")}
          href={helpUrls.orgIdpsUrl}
          isInline
        />
      </div>
      {body}
    </div>
  );
}
