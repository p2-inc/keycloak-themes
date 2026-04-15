import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertVariant,
  Button,
  ClipboardCopy,
  Label,
  PageSection,
  TextContent,
  Text,
  Title,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { CheckCircleIcon } from "@patternfly/react-icons";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useAlerts } from "@/shared/keycloak-ui-shared";
import useOrgFetcher, {
  OrganizationDomainRepresentation,
} from "./useOrgFetcher";
import type { OrgRepresentation } from "./routes";

type OrgDomainsProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

export default function OrgDomains({ org, refresh }: OrgDomainsProps) {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { getOrgDomains, verifyDomain } = useOrgFetcher(realm);
  const { addAlert } = useAlerts();
  const [domains, setDomains] = useState<OrganizationDomainRepresentation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const fetchDomains = async () => {
    try {
      const data = await getOrgDomains(org.id);
      setDomains(data);
    } catch (e) {
      console.error("Error fetching domains", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDomains();
  }, [org]);

  const handleVerify = async (domainName: string) => {
    const result = await verifyDomain(org.id, domainName);
    if (result.success) {
      addAlert("Domain verification triggered.", AlertVariant.success);
      await fetchDomains();
      refresh();
    } else {
      addAlert(
        `Domain verification failed. ${result.message}`,
        AlertVariant.danger,
      );
    }
  };

  if (loading) {
    return null;
  }

  return (
    <PageSection variant="light">
      <Title headingLevel="h2" size="lg" className="pf-v5-u-mb-sm">
        Domains
      </Title>
      <TextContent className="pf-v5-u-mb-lg">
        <Text>View linked domains and verify dns entries.</Text>
      </TextContent>
      {domains.length === 0 ? (
        <TextContent>
          <Text>
            No domains linked to this organization. Add domains in the Settings
            tab.
          </Text>
        </TextContent>
      ) : (
        <Table variant="compact" borders>
          <Thead>
            <Tr>
              <Th>Domain name</Th>
              <Th>Validated</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {domains.map((domain) => (
              <Tr key={domain.domain_name}>
                <Td dataLabel="Domain name">{domain.domain_name}</Td>
                <Td dataLabel="Validated">
                  {domain.verified ? (
                    <Label color="green" icon={<CheckCircleIcon />}>
                      Verified
                    </Label>
                  ) : (
                    <div>
                      <Label color="orange">Verification pending</Label>
                      {domain.record_key && domain.record_value && (
                        <div className="pf-v5-u-mt-sm">
                          <Text component="small" className="pf-v5-u-mb-xs">
                            Create a DNS TXT record for the hostname with the
                            following value
                          </Text>
                          <ClipboardCopy isReadOnly variant="expansion">
                            {`${domain.record_key}=${domain.record_value}`}
                          </ClipboardCopy>
                        </div>
                      )}
                    </div>
                  )}
                </Td>
                <Td dataLabel="Actions" className="pf-v5-u-text-align-right">
                  {!domain.verified && (
                    <Button
                      variant="link"
                      onClick={() => handleVerify(domain.domain_name)}
                    >
                      Verify
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </PageSection>
  );
}
