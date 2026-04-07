import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonVariant,
  Form,
  Modal,
  ModalVariant,
  PageSection,
  Radio,
  FormGroup,
  FormSelect,
  FormSelectOption,
  AlertGroup,
  Alert,
  AlertVariant,
  Badge,
} from "@patternfly/react-core";
import { PaginatingTableToolbar } from "@/shared/keycloak-ui-shared";
import IdentityProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import useLocaleSort, { mapByKey } from "../../../utils/useLocaleSort";
import { useFetch } from "@/shared/keycloak-ui-shared";
import { AlertInfo, SyncMode, idpRep } from "../OrgIdentityProviders";
import useOrgFetcher from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { OrgRepresentation } from "../routes";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { AuthenticationType } from "../../../authentication/constants";
import { fetchWithError } from "@keycloak/keycloak-admin-client";
import { addTrailingSlash } from "../../../util";
import { useAdminClient } from "../../../admin-client";
import { getAuthorizationHeaders } from "../../../utils/getAuthorizationHeaders";
import { OrgConfigType } from "./ManageOrgSettingsDialog";

type IdentityProviderListProps = {
  list?: IdentityProviderRepresentation[];
  setValue: (provider?: IdentityProviderRepresentation) => void;
  org: OrgRepresentation;
};

const syncModeOptions = [
  { value: null, label: "Select one", disabled: false },
  { value: "FORCE", label: "FORCE", disabled: false },
  { value: "LEGACY", label: "LEGACY", disabled: false },
  { value: "IMPORT", label: "IMPORT", disabled: false },
];

const IdentityProviderList = ({
  list,
  setValue,
  org,
}: IdentityProviderListProps) => {
  const { t } = useTranslation();
  return (
    <PageSection variant="light" className="pf-v5-u-py-lg">
      <Form isHorizontal>
        {list?.map((identityProvider) => {
          const homeIdpDiscoveryOrg =
            identityProvider.config?.["home.idp.discovery.org"];
          const idpAssignedToThisOrg = homeIdpDiscoveryOrg?.includes(org.id);
          const isIdPLinked = homeIdpDiscoveryOrg;
          const isIdPEnabled = identityProvider.enabled;

          const idpName =
            identityProvider.displayName ||
            identityProvider.alias ||
            t("noName");
          let idpBadge;
          if (idpAssignedToThisOrg) {
            idpBadge = <Badge>{t("idpAssignedToThisOrg")}</Badge>;
          } else if (isIdPLinked) {
            idpBadge = <Badge isRead>{t("idpLinkedToOrg")}</Badge>;
          }
          if (homeIdpDiscoveryOrg?.includes("#")) {
            idpBadge = (
              <>
                {idpBadge} <Badge isRead>{t("idpLinkedToMultpleOrgs")}</Badge>
              </>
            );
          }

          let description = `${t("alias")}: ${identityProvider.alias}`;
          description += isIdPEnabled
            ? ` (${t("enabled").toLowerCase()})`
            : ` (${t("disabled").toLowerCase()})`;

          return (
            <Radio
              id={identityProvider.internalId!}
              key={identityProvider.internalId}
              name="identityProvider"
              label={
                <>
                  {idpName} {idpBadge}
                </>
              }
              data-testid={identityProvider.internalId}
              description={description}
              onChange={() => {
                setValue(identityProvider);
              }}
              isDisabled={idpAssignedToThisOrg}
              title={idpAssignedToThisOrg ? t("idpAssignedToOrg") : ""}
            />
          );
        })}
      </Form>
    </PageSection>
  );
};

type AssignIdentityProviderProps = {
  onSelect: (
    identityProvider: IdentityProviderRepresentation,
    idpConfig: idpFormValues,
  ) => void;
  onClear: () => void;
  organization: OrgRepresentation;
};

type idpFormValues = {
  postBrokerLoginFlowAlias: IdentityProviderRepresentation["postBrokerLoginFlowAlias"];
  syncMode: SyncMode;
};

export function AssignIdentityProvider({
  onSelect,
  onClear,
  organization,
}: AssignIdentityProviderProps) {
  const { adminClient } = useAdminClient();
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { getIdpsForRealm, getOrgsConfig } = useOrgFetcher(realm);

  const [value, setValue] = useState<IdentityProviderRepresentation>();
  const [identityProviders, setIdentityProviders] =
    useState<IdentityProviderRepresentation[]>();
  const [max, setMax] = useState(10);
  const [first, setFirst] = useState(0);
  const [search, setSearch] = useState("");
  const localeSort = useLocaleSort();
  const [authFlowOptions, setAuthFlowOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [orgConfig, setOrgConfig] = useState<OrgConfigType | null>(null);

  const idpSelectionForm = useForm<idpFormValues>({
    defaultValues: {
      postBrokerLoginFlowAlias: "post org broker login",
      syncMode: "FORCE",
    },
  });

  const {
    control,
    setValue: setFormValue,
    getValues: getFormValues,
  } = idpSelectionForm;

  useEffect(() => {
    setFormValue("postBrokerLoginFlowAlias", value?.postBrokerLoginFlowAlias);
    //@ts-ignore
    setFormValue("syncMode", value?.config?.syncMode);
  }, [value]);

  async function getAuthFlowOptions() {
    const flowsRequest = await fetchWithError(
      `${addTrailingSlash(
        adminClient.baseUrl,
      )}admin/realms/${realm}/ui-ext/authentication-management/flows`,
      {
        method: "GET",
        headers: getAuthorizationHeaders(await adminClient.getAccessToken()),
      },
    );
    const flows = await flowsRequest.json();

    if (!flows) {
      return;
    }

    setAuthFlowOptions(
      flows.map((flow: AuthenticationType) => ({
        value: flow.alias,
        label: flow.alias,
      })),
    );
  }

  useEffect(() => {
    getAuthFlowOptions();
    getOrgsConfig().then((config) => {
      if (!("error" in config)) {
        setOrgConfig(config);
      }
    });
  }, []);

  const page = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return localeSort(identityProviders ?? [], mapByKey("displayName"))
      .filter(
        ({ displayName, alias }) =>
          displayName?.toLowerCase().includes(normalizedSearch) ||
          alias?.toLowerCase().includes(normalizedSearch),
      )
      .slice(first, first + max + 1);
  }, [identityProviders, search, first, max]);

  useFetch(
    async () => {
      const args: { first: number; max: number; search?: string } = {
        first,
        max,
        search: search || undefined,
      };
      return (await getIdpsForRealm(args)) as idpRep[];
    },
    (identityProviders) => {
      setIdentityProviders(identityProviders);
    },
    [search, max, first],
  );

  let warning;
  if (value?.config?.["home.idp.discovery.org"]) {
    warning = t("idpWarningTextLinkedToAnotherOrg");
  }

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={true}
      title={t("assignIdentityProviderTo", { organization: organization.name })}
      onClose={() => onClear()}
      actions={[
        <Button
          id="modal-add"
          data-testid="modal-add"
          key="add"
          isDisabled={!value}
          onClick={() => onSelect(value!, getFormValues() as idpFormValues)}
        >
          {t("assign")}
        </Button>,
        <Button
          data-testid="cancel"
          id="modal-cancel"
          key="cancel"
          variant={ButtonVariant.link}
          onClick={() => {
            onClear();
          }}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      {identityProviders && (
        <PaginatingTableToolbar
          count={identityProviders.length + 1}
          first={first}
          max={max}
          onNextClick={setFirst}
          onPreviousClick={setFirst}
          onPerPageSelect={(first, max) => {
            setFirst(first);
            setMax(max);
          }}
          inputGroupName="search"
          inputGroupPlaceholder={t("search")}
          inputGroupOnEnter={setSearch}
        >
          <IdentityProviderList
            list={identityProviders}
            setValue={setValue}
            org={organization}
          />
        </PaginatingTableToolbar>
      )}
      <FormProvider {...idpSelectionForm}>
        <Form>
          <FormGroup
            label="Post Broker Login"
            fieldId="postBrokerLoginFlowAlias"
          >
            <Controller
              name="postBrokerLoginFlowAlias"
              control={control}
              render={({ field }) => (
                <FormSelect
                  value={field.value}
                  onChange={field.onChange}
                  aria-label="Post Broker Login Flow Alias Input"
                  ouiaId="Post Broker Login Flow Alias Input"
                >
                  {authFlowOptions.map((option, index) => (
                    <FormSelectOption
                      key={index}
                      value={option.value}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              )}
            />
          </FormGroup>
          <FormGroup label="Sync Mode" fieldId="syncMode">
            <Controller
              name="syncMode"
              control={control}
              render={({ field }) => (
                <FormSelect
                  value={field.value}
                  onChange={field.onChange}
                  aria-label="SyncMode Input"
                  ouiaId="SyncMode Input"
                >
                  {syncModeOptions.map((option, index) => (
                    <FormSelectOption
                      isDisabled={option.disabled}
                      key={index}
                      value={option.value}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              )}
            />
          </FormGroup>
        </Form>
      </FormProvider>
      {orgConfig?.sharedIdpsEnabled ? (
        <Alert
          variant={AlertVariant.info}
          isInline
          title={t("configMultipleOrgs")}
          className="pf-v5-u-mt-lg"
        />
      ) : (
        warning && (
          <Alert
            variant={AlertVariant.warning}
            isInline
            title={warning}
            className="pf-v5-u-mt-lg"
          />
        )
      )}
    </Modal>
  );
}
