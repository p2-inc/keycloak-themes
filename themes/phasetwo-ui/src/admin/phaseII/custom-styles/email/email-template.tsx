import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import {
  ActionGroup,
  Alert,
  AlertVariant,
  Button,
  Divider,
  Form,
  FormGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  TextInput,
} from "@patternfly/react-core";
import {
  BaseSyntheticEvent,
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAlerts } from "@/shared/keycloak-ui-shared";
import { get } from "lodash-es";
import phaseTwoLogoUrl from "../../../../login/assets/img/phasetwo-logo.svg";
import { toRealmSettings } from "../../../realm-settings/routes/RealmSettings";

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

const PHASETWO_EMAIL_THEMES = ["attributes", "attributes-v2", "phasetwo-ui"];
const RECOMMENDED_EMAIL_THEME = "phasetwo-ui";

const LOGO_BASE64_ATTR = "_providerConfig.assets.logo.base64";
const FOOTER_LINE1_ATTR = "_providerConfig.assets.email.footer.line1";
const FOOTER_LINE2_ATTR = "_providerConfig.assets.email.footer.line2";

// ─── Email preview ────────────────────────────────────────────────────────────

type EmailPreviewProps = {
  logoBase64: string;
  footerLine1: string;
  footerLine2: string;
  realmDisplayName: string;
};

const EmailPreview = ({
  logoBase64,
  footerLine1,
  footerLine2,
  realmDisplayName,
}: EmailPreviewProps) => (
  <div
    style={{
      background: "#f2f2f2",
      padding: "24px 16px",
      borderRadius: "0.5rem",
      border: "1px solid #e0e0e0",
    }}
  >
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "0.65rem",
        boxShadow:
          "0 1px 3px 0 rgb(0 0 0/0.1), 0 1px 2px -1px rgb(0 0 0/0.1)",
        padding: "32px 40px 16px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#1a1a1a",
        fontSize: 14,
      }}
    >
      {/* Logo — custom if uploaded, Phase Two default otherwise */}
      <img
        src={logoBase64 || phaseTwoLogoUrl}
        alt="Logo"
        style={{
          display: "block",
          maxWidth: 200,
          maxHeight: 80,
          margin: "0 auto 20px",
          objectFit: "contain",
        }}
      />

      {/* Sample body */}
      <p style={{ lineHeight: 1.6, margin: "0 0 12px" }}>
        Hi <strong>User</strong>,
      </p>
      <p style={{ lineHeight: 1.6, margin: "0 0 20px", opacity: 0.7 }}>
        This is a preview of what your email will look like. Your actual email
        content will appear here.
      </p>
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <span
          style={{
            display: "inline-block",
            background: "#171717",
            color: "#fafafa",
            padding: "8px 20px",
            borderRadius: "0.65rem",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Action Button
        </span>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: 12,
          lineHeight: 1.6,
          margin: "16px 0 0",
          textAlign: "center",
          opacity: 0.6,
          paddingTop: 16,
          borderTop: "1px solid #e8e8e8",
        }}
      >
        {footerLine1 || realmDisplayName}
        {footerLine2 && (
          <>
            <br />
            {footerLine2}
          </>
        )}
        <br />
        Powered by{" "}
        <span style={{ color: "#171717", textDecoration: "underline" }}>
          Phase Two
        </span>
      </p>
    </div>
  </div>
);

// ─── PlaceholderSelectOption ──────────────────────────────────────────────────

const PlaceholderSelectOption = () => (
  <SelectOption key="plcSlcOption" value="Clear selection">
    Clear selection
  </SelectOption>
);

interface EmailTemplateMap {
  [key: string]: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export const EmailTemplate = ({ realm, refresh }: EmailTemplateTabProps) => {
  const { realm: realmName } = useRealm();
  const { adminClient } = useAdminClient();
  const { t } = useTranslation();
  const { addAlert, addError } = useAlerts();
  const { getEmailTemplates, getEmailTemplateValue, updateEmailTemplateValue } =
    useStylesFetcher();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Branding state ──────────────────────────────────────────────────────────

  const [logoBase64, setLogoBase64] = useState<string>(
    () => get(realm?.attributes, LOGO_BASE64_ATTR, "") as string,
  );
  const [footerLine1, setFooterLine1] = useState<string>(
    () => get(realm?.attributes, FOOTER_LINE1_ATTR, "") as string,
  );
  const [footerLine2, setFooterLine2] = useState<string>(
    () => get(realm?.attributes, FOOTER_LINE2_ATTR, "") as string,
  );
  const [brandingDirty, setBrandingDirty] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      addError("Logo file size must be less than 1MB.", new Error());
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setLogoBase64(reader.result as string);
      setBrandingDirty(true);
    };
    e.target.value = "";
  };

  const saveBranding = async () => {
    setIsSavingBranding(true);
    const updatedAttributes: Record<string, string | undefined> = {
      ...realm!.attributes,
      [LOGO_BASE64_ATTR]: logoBase64 || undefined,
      [FOOTER_LINE1_ATTR]: footerLine1 || undefined,
      [FOOTER_LINE2_ATTR]: footerLine2 || undefined,
    };

    if (!logoBase64) delete updatedAttributes[LOGO_BASE64_ATTR];
    if (!footerLine1) delete updatedAttributes[FOOTER_LINE1_ATTR];
    if (!footerLine2) delete updatedAttributes[FOOTER_LINE2_ATTR];

    try {
      await adminClient.realms.update(
        { realm: realmName },
        { ...realm, attributes: updatedAttributes },
      );
      addAlert("Email branding saved.", AlertVariant.success);
      setBrandingDirty(false);
      refresh();
    } catch (e) {
      addError("Failed to save email branding.", e);
    } finally {
      setIsSavingBranding(false);
    }
  };

  const resetBranding = () => {
    setLogoBase64(get(realm?.attributes, LOGO_BASE64_ATTR, "") as string);
    setFooterLine1(get(realm?.attributes, FOOTER_LINE1_ATTR, "") as string);
    setFooterLine2(get(realm?.attributes, FOOTER_LINE2_ATTR, "") as string);
    setBrandingDirty(false);
  };

  // ── Theme check ─────────────────────────────────────────────────────────────

  const hasEmailThemeSettingsEnabled = PHASETWO_EMAIL_THEMES.includes(
    realm.emailTheme ?? "",
  );
  const isRecommendedEmailTheme = realm.emailTheme === RECOMMENDED_EMAIL_THEME;
  const [updatingEmailTheme, setUpdatingEmailTheme] = useState(false);

  const updateRealmTheme = async (value: string = RECOMMENDED_EMAIL_THEME) => {
    setUpdatingEmailTheme(true);
    await adminClient.realms.update(
      { realm: realmName },
      { ...realm, emailTheme: value },
    );
    addAlert(`Email theme is now set to "${value}".`);
    refresh();
    setTimeout(() => setUpdatingEmailTheme(false), 5000);
  };

  // ── Template override state ─────────────────────────────────────────────────

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("Select a template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [templateSelectDisabled, setTemplateSelectDisabled] = useState(
    !hasEmailThemeSettingsEnabled,
  );

  const form = useForm<EmailTemplateFormType>({
    defaultValues: { htmlEmail: "", textEmail: "" },
  });
  const { reset: resetForm, getValues, setError, setValue } = form;

  useEffect(() => {
    getEmailTemplates().then((templates) => {
      if (!templates.error) {
        setTemplateSelectDisabled(!hasEmailThemeSettingsEnabled);
        setEmailTemplates(templates);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) {
      setValue("htmlEmail", "");
      setValue("textEmail", "");
      return;
    }
    setValue("htmlEmail", "");
    setValue("textEmail", "");
    setIsLoading(true);
    setTemplateSelectDisabled(true);

    Promise.all([
      getEmailTemplateValue({ templateType: "html", templateName: selectedTemplateId }),
      getEmailTemplateValue({ templateType: "text", templateName: selectedTemplateId }),
    ]).then(([htmlT, textT]) => {
      if (htmlT.error) addError(htmlT.message, "error");
      else setValue("htmlEmail", htmlT.message);
      if (textT.error) addError(textT.message, "error");
      else setValue("textEmail", textT.message);
      setTemplateSelectDisabled(false);
      setIsLoading(false);
    });
  }, [selectedTemplateId]);

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

  const saveTemplate = async () => {
    const { htmlEmail, textEmail } = getValues();
    try {
      setIsSaving(true);
      setTemplateSelectDisabled(true);
      const [htmlResp, textResp] = await Promise.all([
        updateEmailTemplateValue({
          templateType: "html",
          templateName: selectedTemplateId!,
          templateBody: htmlEmail,
        }),
        updateEmailTemplateValue({
          templateType: "text",
          templateName: selectedTemplateId!,
          templateBody: textEmail,
        }),
      ]);
      if (htmlResp.error)
        setError("htmlEmail", { type: "custom", message: htmlResp.message });
      if (textResp.error)
        setError("textEmail", { type: "custom", message: textResp.message });
      if (htmlResp.error || textResp.error)
        throw new Error(htmlResp.error ? htmlResp.message : textResp.message);
      addAlert(`Templates for ${selectedTemplate} updated.`);
    } catch (e) {
      addError("Failed to update email templates.", e);
    } finally {
      refresh();
      setIsSaving(false);
      setTemplateSelectDisabled(false);
    }
  };

  const resetTemplate = () => {
    clearSelection();
    resetForm();
  };

  const realmDisplayName =
    (realm as any).displayName || (realm as any).name || realmName;

  const templateSelectOptions = [
    <PlaceholderSelectOption key="plcSlcOption" />,
    ...Object.keys(emailTemplates).map((k) => (
      <SelectOption key={k} value={k} id={k} itemID={k}>
        {`${emailTemplates[k]} (${k})`}
      </SelectOption>
    )),
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageSection variant="light" className="keycloak__form">
      {/* Theme alerts */}
      {!hasEmailThemeSettingsEnabled && (
        <Alert
          variant="warning"
          title="Realm setting change is required"
          className="pf-v5-u-mb-lg"
        >
          <p>
            Your email theme must be set to <code>phasetwo-ui</code> for these
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
      {hasEmailThemeSettingsEnabled && !isRecommendedEmailTheme && (
        <Alert
          variant="info"
          title="Upgrade your email theme"
          className="pf-v5-u-mb-lg"
        >
          <p>
            You are using <code>{realm.emailTheme}</code>. We recommend
            upgrading to <code>phasetwo-ui</code> for the latest features.
          </p>
          <Button
            size="sm"
            variant="link"
            className="pf-v5-u-mt-sm"
            onClick={() => updateRealmTheme()}
            isLoading={updatingEmailTheme}
            isDisabled={updatingEmailTheme}
          >
            {updatingEmailTheme ? "Upgrading..." : "Upgrade to phasetwo-ui"}
          </Button>
        </Alert>
      )}

      {/* ── Section 1: Branding ─────────────────────────────────────────── */}
      <h2 className="pf-v5-c-title pf-m-xl pf-v5-u-mb-md">Email Branding</h2>

      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="pf-v5-u-display-none"
        onChange={handleLogoUpload}
      />

      <Form isHorizontal className="pf-v5-u-mb-lg">
        {/* Logo */}
        <FormGroup label="Email logo" fieldId="email-logo">
          <div className="pf-v5-u-display-flex pf-v5-u-flex-direction-column pf-v5-u-row-gap-sm">
            {logoBase64 && (
              <img
                src={logoBase64}
                alt="Email logo preview"
                style={{ maxWidth: 200, maxHeight: 80, objectFit: "contain" }}
              />
            )}
            <div className="pf-v5-u-display-flex pf-v5-u-column-gap-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoBase64 ? "Replace logo" : "Upload logo"}
              </Button>
              {logoBase64 && (
                <Button
                  variant="plain"
                  size="sm"
                  onClick={() => {
                    setLogoBase64("");
                    setBrandingDirty(true);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            <span className="pf-v5-u-color-400" style={{ fontSize: 13 }}>
              Uploaded images are base64-encoded and embedded directly in
              emails. Max 1MB. PNG or SVG recommended.
            </span>
          </div>
        </FormGroup>

        {/* Footer lines */}
        <FormGroup label="Footer line 1" fieldId="footer-line-1">
          <TextInput
            id="footer-line-1"
            value={footerLine1}
            onChange={(_e, v) => {
              setFooterLine1(v);
              setBrandingDirty(true);
            }}
            placeholder={realmDisplayName}
          />
        </FormGroup>
        <FormGroup label="Footer line 2" fieldId="footer-line-2">
          <TextInput
            id="footer-line-2"
            value={footerLine2}
            onChange={(_e, v) => {
              setFooterLine2(v);
              setBrandingDirty(true);
            }}
            placeholder="Optional tagline or contact info"
          />
        </FormGroup>

        <ActionGroup>
          <Button
            variant="primary"
            onClick={saveBranding}
            isDisabled={!brandingDirty || isSavingBranding}
            isLoading={isSavingBranding}
          >
            Save
          </Button>
          <Button
            variant="link"
            onClick={resetBranding}
            isDisabled={!brandingDirty}
          >
            Revert
          </Button>
        </ActionGroup>
      </Form>

      {/* ── Section 2: Preview ──────────────────────────────────────────── */}
      <h2 className="pf-v5-c-title pf-m-xl pf-v5-u-mb-md">Preview</h2>
      <Alert
        variant="info"
        isInline
        isPlain
        title={
          <span>
            To send a test email, go to{" "}
            <Link to={toRealmSettings({ realm: realmName, tab: "email" })}>
              Realm Settings &rsaquo; Email
            </Link>
            .
          </span>
        }
        className="pf-v5-u-mb-md"
      />
      <div className="pf-v5-u-mb-xl">
        <EmailPreview
          logoBase64={logoBase64}
          footerLine1={footerLine1}
          footerLine2={footerLine2}
          realmDisplayName={realmDisplayName}
        />
      </div>

      <Divider className="pf-v5-u-my-xl" />

      {/* ── Section 3: Template overrides ───────────────────────────────── */}
      <h2 className="pf-v5-c-title pf-m-xl pf-v5-u-mb-sm">
        Template Overrides
      </h2>
      <p className="pf-v5-u-mb-lg pf-v5-u-color-400">
        Override the default content of individual email templates. Select a
        template below to customize its HTML and plain-text versions.
      </p>

      <Form className="pf-v5-u-mb-lg">
        <FormGroup
          fieldId="emailTemplateSelect"
          label={
            <span>
              Select template to customize{" "}
              {isLoading && <Spinner size="sm" />}
            </span>
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
            // @ts-expect-error: event assignment
            onSelect={selectTemplate}
            selected={selectedTemplate}
            isOpen={isTemplateSelectOpen}
            id="emailTemplateSelect"
          >
            <SelectList>{templateSelectOptions}</SelectList>
          </Select>
        </FormGroup>
      </Form>

      <Form isHorizontal>
        <FormProvider {...form}>
          <TextAreaControl
            label={t("htmlEmail")}
            labelIcon={t("formHelpHtmlTemplate")}
            id="htmlEmail"
            data-testid="htmlEmail"
            name="htmlEmail"
            rows={10}
            isDisabled={templateSelectDisabled}
          />
          <TextAreaControl
            id="textEmail"
            data-testid="textEmail"
            name="textEmail"
            label={t("textEmail")}
            labelIcon={t("formHelpTextTemplate")}
            rows={10}
            isDisabled={templateSelectDisabled}
          />
          <SaveReset
            name="emailTemplates"
            save={saveTemplate}
            reset={resetTemplate}
            isActive={!!selectedTemplateId && !isSaving}
          />
        </FormProvider>
      </Form>
    </PageSection>
  );
};
