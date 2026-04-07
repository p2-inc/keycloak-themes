import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import {
  Alert,
  Button,
  Form,
  FormGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Spinner,
} from "@patternfly/react-core";
import { BaseSyntheticEvent, ChangeEvent, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAlerts } from "@/shared/keycloak-ui-shared";

import { TextAreaControl } from "@/shared/keycloak-ui-shared";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { SaveReset } from "../components/SaveReset";
import useStylesFetcher from "../useStylesFetcher";
import { useAdminClient } from "../../../admin-client";

type EmailTemplateTabProps = {
  realm: RealmRepresentation;
  refresh: () => void;
};

type EmailTemplateFormType = {
  htmlEmail: string;
  textEmail: string;
};

const PlaceholderSelectOption = () => (
  <SelectOption key="plcSlcOption" value="Clear selection">
    Clear selection
  </SelectOption>
);

interface EmailTemplateMap {
  [key: string]: string;
}

export const EmailTemplate = ({ realm, refresh }: EmailTemplateTabProps) => {
  const { realm: realmName } = useRealm();
  const { adminClient } = useAdminClient();
  const { t } = useTranslation();
  const { addAlert, addError } = useAlerts();
  const { getEmailTemplates, getEmailTemplateValue, updateEmailTemplateValue } =
    useStylesFetcher();
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingEmailTheme, setUpdatingEmailTheme] = useState(false);

  const form = useForm<EmailTemplateFormType>({
    defaultValues: {
      htmlEmail: "",
      textEmail: "",
    },
  });
  const { reset: resetForm, getValues, setError, setValue } = form;

  const hasEmailThemeSettingsEnabled = realm.emailTheme === "attributes";

  async function getEmailTemplatesInfo() {
    const emailTemplates = await getEmailTemplates();
    if (!emailTemplates.error) {
      setTemplateSelectDisabled(!hasEmailThemeSettingsEnabled);
      setEmailTemplates(emailTemplates);
    }
  }

  useEffect(() => {
    getEmailTemplatesInfo();
  }, []);

  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("Select a template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [templateSelectDisabled, setTemplateSelectDisabled] = useState(
    !hasEmailThemeSettingsEnabled,
  );

  const getEmailTemplateValues = async () => {
    if (selectedTemplateId) {
      setValue("htmlEmail", "");
      setValue("textEmail", "");
      setIsLoading(true);
      setTemplateSelectDisabled(true);

      // Call to get email templates
      const htmlT = await getEmailTemplateValue({
        templateType: "html",
        templateName: selectedTemplateId,
      });
      const textT = await getEmailTemplateValue({
        templateType: "text",
        templateName: selectedTemplateId,
      });

      if (htmlT.error) {
        addError(htmlT.message, "error");
      } else {
        setValue("htmlEmail", htmlT.message);
      }
      if (textT.error) {
        addError(textT.message, "error");
      } else {
        setValue("textEmail", textT.message);
      }
    } else {
      setValue("htmlEmail", "");
      setValue("textEmail", "");
    }
    setTemplateSelectDisabled(false);
    setIsLoading(false);
  };

  useEffect(() => {
    getEmailTemplateValues();
  }, [selectedTemplateId]);

  const emailTemplateSelectOptions = Object.keys(emailTemplates).map((k) => (
    <SelectOption
      key={k}
      value={k}
      id={k}
      itemID={k}
    >{`${emailTemplates[k]} (${k})`}</SelectOption>
  ));
  const templateSelectOptions = [
    <PlaceholderSelectOption key="plcSlcOption" />,
    ...emailTemplateSelectOptions,
  ];

  const clearSelection = () => {
    setSelectedTemplate("Select a template");
    setSelectedTemplateId(undefined);
    setIsTemplateSelectOpen(false);
  };

  const selectTemplate = (
    _event: MouseEvent | ChangeEvent | BaseSyntheticEvent,
    value: string,
  ) => {
    if (value === "Clear selection") clearSelection();
    else {
      setSelectedTemplate(`${emailTemplates[value]} (${value})`);
      setSelectedTemplateId(value);
      setIsTemplateSelectOpen(false);
    }
  };

  const save = async () => {
    const { htmlEmail, textEmail } = getValues();

    try {
      setIsSaving(true);
      setTemplateSelectDisabled(true);
      const htmlResp = await updateEmailTemplateValue({
        templateType: "html",
        templateName: selectedTemplateId!,
        templateBody: htmlEmail,
      });
      const textResp = await updateEmailTemplateValue({
        templateType: "text",
        templateName: selectedTemplateId!,
        templateBody: textEmail,
      });

      if (htmlResp.error || textResp.error) {
        if (htmlResp.error) {
          setError("htmlEmail", { type: "custom", message: htmlResp.message });
        }
        if (textResp.error) {
          setError("textEmail", { type: "custom", message: textResp.message });
        }
        throw new Error(htmlResp.error ? htmlResp.message : textResp.message);
      }
      addAlert(`Templates for the ${selectedTemplate} have been updated.`);
    } catch (e) {
      console.error("Could not update the email templates.", e);
      addError("Failed to update the email templates.", e);
    } finally {
      refresh();
    }
    setIsSaving(false);
    setTemplateSelectDisabled(false);
  };

  const reset = async () => {
    clearSelection();
    resetForm();
  };

  const updateRealmTheme = async (value: string = "attributes") => {
    setUpdatingEmailTheme(true);
    await adminClient.realms.update(
      { realm: realmName },
      { ...realm, emailTheme: value },
    );
    addAlert('Email theme is now set to "attributes".');
    refresh();
    setTimeout(() => setUpdatingEmailTheme(false), 5000);
    setTemplateSelectDisabled(false);
  };

  return (
    <PageSection variant="light" className="keycloak__form">
      {!hasEmailThemeSettingsEnabled && (
        <Alert variant="warning" title="Realm setting change is required">
          <p>
            Your email theme must be set to <code>attributes</code> for these
            changes to take effect.
          </p>
          <Button
            size="sm"
            className="pf-v5-u-mt-sm"
            onClick={() => updateRealmTheme()}
            isLoading={updatingEmailTheme}
            isDisabled={updatingEmailTheme}
          >
            {updatingEmailTheme ? "Activating..." : "Activate"}
          </Button>
        </Alert>
      )}
      <p className="pf-v5-u-mt-lg">
        Use these templates to override the default content of your emails.
      </p>

      <Form className="pf-v5-u-mt-lg pf-v5-u-pb-lg">
        <FormGroup
          fieldId="emailTemplateSelect"
          label={
            <div>
              Select email template to customize{" "}
              {isLoading && <Spinner size="sm" />}
            </div>
          }
        >
          <Select
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                onClick={() => setIsTemplateSelectOpen(!isTemplateSelectOpen)}
                isExpanded={isTemplateSelectOpen}
                isDisabled={templateSelectDisabled}
              >
                {selectedTemplate}
              </MenuToggle>
            )}
            aria-label="Select email template"
            // @ts-expect-error: event assignment description
            onSelect={selectTemplate}
            selected={selectedTemplate}
            isOpen={isTemplateSelectOpen}
            aria-labelledby={"Select email template"}
            id="emailTemplateSelect"
          >
            <SelectList>{templateSelectOptions}</SelectList>
          </Select>
        </FormGroup>
      </Form>

      <Form isHorizontal className="pf-v5-u-mt-lg">
        <FormProvider {...form}>
          {/* HTML Template */}

          <TextAreaControl
            label={t("htmlEmail")}
            labelIcon={t("formHelpHtmlTemplate")}
            id="htmlEmail"
            data-testid="htmlEmail"
            name="htmlEmail"
            rows={10}
            isDisabled={templateSelectDisabled}
          />

          {/* Text Template */}

          <TextAreaControl
            id="textEmail"
            data-testid="textEmail"
            name="textEmail"
            label={t("textEmail")}
            labelIcon={t("formHelpTextTemplate")}
            rows={10}
            isDisabled={templateSelectDisabled}
            rules={{ required: true }}
          />

          <SaveReset
            name="emailTemplates"
            save={save}
            reset={reset}
            isActive={!!selectedTemplateId && !isSaving}
          />
        </FormProvider>
      </Form>
    </PageSection>
  );
};
