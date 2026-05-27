import { useAlerts } from "@/shared/keycloak-ui-shared";
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Checkbox,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  Text,
  TextContent,
  TextInput,
} from "@patternfly/react-core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "@/shared/keycloak-ui-shared";
import { isNil } from "lodash-es";
import { useRealm } from "../../../context/realm-context/RealmContext";
import useOrgFetcher from "../useOrgFetcher";

type ManageOrderDialogProps = {
  onClose: () => void;
};

export type OrgConfigType = {
  createAdminUserEnabled: boolean;
  sharedIdpsEnabled: boolean;
  multipleIdpsEnabled: boolean;
  validateIdpEnabled: boolean;
  scimEnabled: boolean;
  expirationInSecs?: number;
};

export const ManageOrgSettingsDialog = ({
  onClose,
}: ManageOrderDialogProps) => {
  const { realm } = useRealm();
  const { getOrgsConfig, updateOrgsConfig } = useOrgFetcher(realm);

  const { t } = useTranslation();
  const { addAlert, addError } = useAlerts();

  const [orgConfig, setOrgConfig] = useState<OrgConfigType | null>(null);
  const [currentOrgConfig, setCurrentOrgConfig] =
    useState<OrgConfigType | null>(null);

  useFetch(
    () => getOrgsConfig(),
    (config) => {
      if (!("error" in config)) {
        setOrgConfig(config);
        setCurrentOrgConfig(config);
      } else {
        addError(t("orgConfigFetchUpdatesError"), config.message);
      }
    },
    [],
  );

  async function updateOrgsConfigForm() {
    if (!orgConfig) {
      return;
    }
    try {
      const resp = await updateOrgsConfig(orgConfig);

      if (resp.success) {
        addAlert(t("orgConfigUpdatedSuccess"), AlertVariant.success);
        onClose();
      } else {
        addError(t("orgConfigUpdatedError"), resp.message);
      }
    } catch (error) {
      console.error("Failed to update org config", error);
    }
  }

  return (
    <Modal
      variant={ModalVariant.small}
      title={t("manageOrgSettings")}
      isOpen
      onClose={onClose}
      actions={[
        <Button
          id="modal-confirm"
          data-testid="confirm"
          key="confirm"
          disabled={isNil(orgConfig)}
          onClick={async () => {
            updateOrgsConfigForm();
          }}
        >
          {t("save")}
        </Button>,
        <Button
          id="modal-cancel"
          data-testid="cancel"
          key="cancel"
          variant={ButtonVariant.link}
          onClick={onClose}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      <TextContent className="pf-v5-u-pb-lg">
        <Text>{t("manageOrgSettingsExplainer")}</Text>
      </TextContent>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          updateOrgsConfigForm();
        }}
      >
        <FormGroup
          label={t("createAdminUser")}
          fieldId="createAdminUser"
          disabled={isNil(orgConfig)}
        >
          <Checkbox
            label={t("createAdminUser")}
            aria-label={t("createAdminUser")}
            id="createAdminUser"
            description={t("createAdminUserExplainer")}
            isChecked={orgConfig?.createAdminUserEnabled}
            isDisabled={isNil(orgConfig)}
            onChange={(_evt, checked) =>
              setOrgConfig({ ...orgConfig!, createAdminUserEnabled: checked })
            }
          />
        </FormGroup>
        <FormGroup
          label={t("sharedIdps")}
          fieldId="sharedIdps"
          disabled={isNil(orgConfig)}
        >
          <Checkbox
            label={t("sharedIdps")}
            aria-label={t("sharedIdps")}
            id="sharedIdps"
            description={t("sharedIdpsExplainer")}
            isChecked={orgConfig?.sharedIdpsEnabled}
            isDisabled={isNil(orgConfig)}
            onChange={(_evt, checked) =>
              setOrgConfig({ ...orgConfig!, sharedIdpsEnabled: checked })
            }
          />
          {currentOrgConfig?.sharedIdpsEnabled === true &&
            orgConfig?.sharedIdpsEnabled === false && (
              <Alert
                variant={AlertVariant.warning}
                isInline
                title={t("orgSettingsSharedIdpsWarning")}
                className="pf-v5-u-mt-lg"
              />
            )}
        </FormGroup>
        <FormGroup
          label={t("multipleIdpsEnabled")}
          fieldId="multipleIdpsEnabled"
          disabled={isNil(orgConfig)}
        >
          <Checkbox
            label={t("multipleIdpsEnabled")}
            aria-label={t("multipleIdpsEnabled")}
            id="multipleIdpsEnabled"
            description={t("multipleIdpsEnabledExplainer")}
            isChecked={orgConfig?.multipleIdpsEnabled}
            isDisabled={isNil(orgConfig)}
            onChange={(_evt, checked) =>
              setOrgConfig({ ...orgConfig!, multipleIdpsEnabled: checked })
            }
          />
          {currentOrgConfig?.multipleIdpsEnabled === true &&
            orgConfig?.multipleIdpsEnabled === false && (
              <Alert
                variant={AlertVariant.warning}
                isInline
                title={t("orgSettingsMultipleIdpsEnabledWarning")}
                className="pf-v5-u-mt-lg"
              />
            )}
        </FormGroup>
        <FormGroup
          label={t("validateIdpEnabled")}
          fieldId="validateIdpEnabled"
          disabled={isNil(orgConfig)}
        >
          <Checkbox
            label={t("validateIdpEnabled")}
            aria-label={t("validateIdpEnabled")}
            id="validateIdpEnabled"
            description={t("validateIdpEnabledExplainer")}
            isChecked={orgConfig?.validateIdpEnabled}
            isDisabled={isNil(orgConfig)}
            onChange={(_evt, checked) =>
              setOrgConfig({ ...orgConfig!, validateIdpEnabled: checked })
            }
          />
          {currentOrgConfig?.validateIdpEnabled === true &&
            orgConfig?.validateIdpEnabled === false && (
              <Alert
                variant={AlertVariant.warning}
                isInline
                title={t("orgSettingsValidateIdpEnabledWarning")}
                className="pf-v5-u-mt-lg"
              />
            )}
        </FormGroup>
        <FormGroup
          label={t("scimEnabled")}
          fieldId="scimEnabled"
          disabled={isNil(orgConfig)}
        >
          <Checkbox
            label={t("scimEnabled")}
            aria-label={t("scimEnabled")}
            id="scimEnabled"
            description={t("scimEnabledExplainer")}
            isChecked={orgConfig?.scimEnabled}
            isDisabled={isNil(orgConfig)}
            onChange={(_evt, checked) =>
              setOrgConfig({ ...orgConfig!, scimEnabled: checked })
            }
          />
          {currentOrgConfig?.scimEnabled === true &&
            orgConfig?.scimEnabled === false && (
              <Alert
                variant={AlertVariant.warning}
                isInline
                title={t("orgSettingsScimEnabledWarning")}
                className="pf-v5-u-mt-lg"
              />
            )}
        </FormGroup>
        <FormGroup
          label={t("consoleLinkExpiration")}
          fieldId="consoleLinkExpiration"
          disabled={isNil(orgConfig)}
        >
          <TextInput
            id="consoleLinkExpiration"
            defaultValue={orgConfig?.expirationInSecs}
            value={orgConfig?.expirationInSecs}
            placeholder="time in seconds (86400 is default)"
            isDisabled={isNil(orgConfig)}
            type="number"
            onChange={(e) => {
              const raw = e.currentTarget.value;
              const parsed = Number(raw);
              // Only save when parsed is a finite number;
              if (Number.isFinite(parsed)) {
                setOrgConfig({ ...orgConfig!, expirationInSecs: parsed });
              }
            }}
          />
          <TextContent className="pf-v5-u-font-size-sm pf-v5-u-color-400">
            <Text>{t("consoleLinkExpirationHelpText")}</Text>
          </TextContent>
        </FormGroup>
      </Form>
    </Modal>
  );
};
