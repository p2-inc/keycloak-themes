import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionGroup,
  ActionList,
  ActionListItem,
  Alert,
  AlertVariant,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  PageSection,
  PageSectionVariants,
  TextInput,
} from "@patternfly/react-core";
import { MinusCircleIcon, PlusCircleIcon } from "@patternfly/react-icons";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";

import { KeycloakSpinner, useAlerts } from "@/shared/keycloak-ui-shared";
import { FormAccess } from "../../components/form/FormAccess";
import { FormattedLink } from "../../components/external-link/FormattedLink";
import helpUrls from "../../help-urls";
import { useAdminClient } from "../../admin-client";
import {
  getProviderConfigFormAttributes,
  isProviderConfigKey,
  mergeProviderConfigAttributes,
} from "./realm-settings-attributes";

type RealmSettingsAttributeTabProps = {
  realm: RealmRepresentation;
};

type ProviderConfigRow = {
  id: number;
  key: string;
  value: string;
};

let nextRowId = 0;

const createRowId = () => {
  nextRowId += 1;
  return nextRowId;
};

const toRows = (realmData: RealmRepresentation): ProviderConfigRow[] =>
  getProviderConfigFormAttributes(realmData).map(({ key, value }) => ({
    id: createRowId(),
    key,
    value,
  }));

const cloneRows = (rows: ProviderConfigRow[]) =>
  rows.map(({ key, value }) => ({
    id: createRowId(),
    key,
    value,
  }));

const toSubmittedAttributes = (rows: ProviderConfigRow[]) =>
  rows.map(({ key, value }) => ({ key, value }));

const normalizeRows = (rows: ProviderConfigRow[]) =>
  rows.map(({ key, value }) => ({ key, value }));

const getDuplicateKeys = (rows: ProviderConfigRow[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  rows.forEach(({ key }) => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      return;
    }

    if (seen.has(trimmedKey)) {
      duplicates.add(trimmedKey);
      return;
    }

    seen.add(trimmedKey);
  });

  return [...duplicates].sort((a, b) => a.localeCompare(b));
};

export const RealmSettingsAttributeTab = ({
  realm: defaultRealm,
}: RealmSettingsAttributeTabProps) => {
  const { t } = useTranslation("realm-settings");
  const { addAlert, addError } = useAlerts();
  const { adminClient } = useAdminClient();

  const [realm, setRealm] = useState<RealmRepresentation>();
  const [rows, setRows] = useState<ProviderConfigRow[]>([]);
  const [initialRows, setInitialRows] = useState<ProviderConfigRow[]>([]);
  const [loadedProviderConfigKeys, setLoadedProviderConfigKeys] = useState<
    string[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    JSON.stringify(normalizeRows(rows)) !==
    JSON.stringify(normalizeRows(initialRows));
  const hasBlankKeys = rows.some(({ key }) => key.trim().length === 0);
  const duplicateKeys = useMemo(() => getDuplicateKeys(rows), [rows]);
  const invalidPrefixKeys = useMemo(
    () =>
      rows
        .map(({ key }) => key.trim())
        .filter((key) => key.length > 0 && !isProviderConfigKey(key))
        .sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const canSave =
    !!realm &&
    isDirty &&
    !isSaving &&
    !hasBlankKeys &&
    duplicateKeys.length === 0 &&
    invalidPrefixKeys.length === 0;

  const syncFromRealm = (realmData: RealmRepresentation) => {
    const nextRows = toRows(realmData);
    setRealm(realmData);
    setRows(nextRows);
    setInitialRows(cloneRows(nextRows));
    setLoadedProviderConfigKeys(nextRows.map(({ key }) => key.trim()));
  };

  const loadRealm = async () => {
    setIsLoading(true);

    try {
      const freshRealm = await adminClient.realms.findOne({
        realm: defaultRealm.realm!,
      });
      syncFromRealm(freshRealm || defaultRealm);
    } catch {
      syncFromRealm(defaultRealm);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRealm();
  }, [adminClient, defaultRealm.realm]);

  const updateRow = (
    index: number,
    field: "key" | "value",
    nextValue: string,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: nextValue } : row,
      ),
    );
  };

  const addRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      { id: createRowId(), key: "", value: "" },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((currentRows) =>
      currentRows.filter((_row, rowIndex) => rowIndex !== index),
    );
  };

  const reset = () => {
    setRows(cloneRows(initialRows));
  };

  const save = async () => {
    if (!realm || !canSave) {
      return;
    }

    setIsSaving(true);

    try {
      const latestRealm =
        (await adminClient.realms.findOne({
          realm: realm.realm!,
        })) || realm;

      const attributes = mergeProviderConfigAttributes(
        latestRealm.attributes,
        toSubmittedAttributes(rows),
        loadedProviderConfigKeys,
      );

      const updatedRealm = { ...latestRealm, attributes };

      await adminClient.realms.update(
        { realm: latestRealm.realm! },
        updatedRealm,
      );

      syncFromRealm(updatedRealm);
      addAlert(t("saveRealmSettingsSuccess"), AlertVariant.success);
    } catch (error) {
      addError("groups:groupUpdateError", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !realm) {
    return <KeycloakSpinner />;
  }

  return (
    <PageSection variant={PageSectionVariants.light}>
      <Alert
        variant="danger"
        title={t("realmSettingsAttributesExpertModeTitle")}
        className="pf-v5-u-mb-lg pf-v5-u-w-75-on-md"
      >
        <p>
          {t("realmSettingsAttributesExpertModeBody")}{" "}
          <FormattedLink
            title={t("learnMore")}
            href={helpUrls.realmAttributesUrl}
            isInline
          />
        </p>
      </Alert>
      <Alert
        variant="info"
        title={t("realmSettingsAttributesProviderConfigOnlyTitle")}
        className="pf-v5-u-mb-lg pf-v5-u-w-75-on-md"
      >
        <p>{t("realmSettingsAttributesProviderConfigOnlyBody")}</p>
      </Alert>
      <div className="pf-v5-u-mb-lg pf-v5-u-w-75-on-md">
        <FormAccess role="manage-realm">
          <Flex direction={{ default: "column" }}>
            <Flex>
              <FlexItem
                grow={{ default: "grow" }}
                spacer={{ default: "spacerNone" }}
              >
                <strong>{t("key")}</strong>
              </FlexItem>
              <FlexItem grow={{ default: "grow" }}>
                <strong>{t("value")}</strong>
              </FlexItem>
            </Flex>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <Flex key={row.id} data-testid="row">
                  <FlexItem grow={{ default: "grow" }}>
                    <TextInput
                      value={row.key}
                      placeholder={t("keyPlaceholder")}
                      aria-label={t("key")}
                      data-testid={`attributes[${index}].key`}
                      onChange={(_event, value) =>
                        updateRow(index, "key", value)
                      }
                    />
                  </FlexItem>
                  <FlexItem
                    grow={{ default: "grow" }}
                    spacer={{ default: "spacerNone" }}
                  >
                    <TextInput
                      value={row.value}
                      placeholder={t("valuePlaceholder")}
                      aria-label={t("value")}
                      data-testid={`attributes[${index}].value`}
                      onChange={(_event, value) =>
                        updateRow(index, "value", value)
                      }
                    />
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="link"
                      isDanger
                      title={t("removeAttribute")}
                      data-testid={`attributes[${index}].remove`}
                      onClick={() => removeRow(index)}
                    >
                      <MinusCircleIcon />
                    </Button>
                  </FlexItem>
                </Flex>
              ))
            ) : (
              <EmptyState
                data-testid="attributes-empty-state"
                className="pf-v5-u-p-0"
                variant="xs"
              >
                <EmptyStateBody>
                  {t("realmSettingsAttributesEmptyState")}
                </EmptyStateBody>
                <EmptyStateFooter>
                  <Button
                    data-testid="attributes-add-row"
                    variant="link"
                    icon={<PlusCircleIcon />}
                    size="sm"
                    onClick={addRow}
                  >
                    {t("addAttribute", { label: t("attribute") })}
                  </Button>
                </EmptyStateFooter>
              </EmptyState>
            )}
          </Flex>
          {rows.length > 0 && (
            <ActionList>
              <ActionListItem>
                <Button
                  data-testid="attributes-add-row"
                  className="pf-v5-u-px-0 pf-v5-u-mt-sm"
                  variant="link"
                  icon={<PlusCircleIcon />}
                  onClick={addRow}
                >
                  {t("addAttribute", { label: t("attribute") })}
                </Button>
              </ActionListItem>
            </ActionList>
          )}
          {hasBlankKeys && (
            <Alert
              isInline
              variant="warning"
              title={t("realmSettingsAttributesBlankKeyWarning")}
              className="pf-v5-u-mt-md"
            />
          )}
          {invalidPrefixKeys.length > 0 && (
            <Alert
              isInline
              variant="warning"
              title={t("realmSettingsAttributesInvalidPrefixWarning")}
              className="pf-v5-u-mt-md"
            >
              <p>{invalidPrefixKeys.join(", ")}</p>
            </Alert>
          )}
          {duplicateKeys.length > 0 && (
            <Alert
              isInline
              variant="warning"
              title={t("realmSettingsAttributesDuplicateKeyWarning")}
              className="pf-v5-u-mt-md"
            >
              <p>{duplicateKeys.join(", ")}</p>
            </Alert>
          )}
          <ActionGroup className="kc-attributes__action-group">
            <Button
              data-testid="save-attributes"
              variant="primary"
              onClick={save}
              isDisabled={!canSave}
              isLoading={isSaving}
            >
              {t("save")}
            </Button>
            <Button
              onClick={reset}
              variant="link"
              isDisabled={!isDirty || isSaving}
            >
              {t("revert")}
            </Button>
          </ActionGroup>
        </FormAccess>
      </div>
    </PageSection>
  );
};
