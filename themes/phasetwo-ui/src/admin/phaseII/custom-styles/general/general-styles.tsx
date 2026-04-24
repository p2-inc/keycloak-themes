import {
  Alert,
  AlertVariant,
  Brand,
  Form,
  FormGroup,
  PageSection,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
} from "@patternfly/react-core";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { TextControl } from "@/shared/keycloak-ui-shared";
import { SaveReset } from "../components/SaveReset";
import { useState, ReactElement, useEffect } from "react";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import { get } from "lodash-es";
import { useAlerts } from "@/shared/keycloak-ui-shared";
import { toStyles } from "../routes/Styles";

import { useAdminClient } from "../../../admin-client";
import { useRealm } from "../../../context/realm-context/RealmContext";

type GeneralStylesType = {
  logoUrl: string;
  faviconUrl: string;
  appIconUrl: string;
};

type GeneralStylesArgs = {
  refresh: () => void;
  realm: RealmRepresentation;
};

const LogoContainer = ({
  title,
  children,
}: {
  title: string;
  children: ReactElement<any, any>;
}) => {
  return (
    <Panel variant="bordered">
      <PanelHeader>{title}</PanelHeader>
      <PanelMain>
        <PanelMainBody>{children}</PanelMainBody>
      </PanelMain>
    </Panel>
  );
};

const InvalidImageError = () => (
  <div>Invalid image url. Please check the link above.</div>
);

const ImageInstruction = ({ name }: { name: string }) => (
  <div className="text-muted-foreground">
    Enter a custom URL for the {name} to preview the image.
  </div>
);

export const GeneralStyles = ({ refresh, realm }: GeneralStylesArgs) => {
  const { t } = useTranslation();
  const { adminClient } = useAdminClient();
  const { realm: realmName } = useRealm();
  const { addAlert, addError } = useAlerts();
  const form = useForm<GeneralStylesType>({
    defaultValues: {
      logoUrl: "",
      faviconUrl: "",
      appIconUrl: "",
    },
  });

  const {
    control,
    reset,
    getValues,
    setError,
    clearErrors,
    setValue,
    formState: { isDirty },
  } = form;

  async function loadRealm() {
    const realmInfo = realm;
    setValue(
      "logoUrl",
      get(realmInfo?.attributes, "_providerConfig.assets.logo.url", ""),
    );
    setValue(
      "faviconUrl",
      get(realmInfo?.attributes, "_providerConfig.assets.favicon.url", ""),
    );
    setValue(
      "appIconUrl",
      get(realmInfo?.attributes, "_providerConfig.assets.appicon.url", ""),
    );
  }

  const [logoUrlError, setLogoUrlError] = useState(false);
  const [faviconUrlError, setFaviconUrlError] = useState(false);
  const [appIconUrlError, setAppIconUrlError] = useState(false);

  useEffect(() => {
    loadRealm();
  }, []);

  const isValidUrl = (
    isValid: boolean,
    formElement: "logoUrl" | "faviconUrl" | "appIconUrl",
    setUrlError: (errorState: boolean) => void,
  ) => {
    if (isValid) {
      clearErrors(formElement);
      setUrlError(false);
    } else {
      setUrlError(true);
      setError(formElement, {
        type: "custom",
        message: t("formHelpImageInvalid"),
      });
    }
  };

  useWatch({ name: "logoUrl", control });
  useWatch({ name: "faviconUrl", control });
  useWatch({ name: "appIconUrl", control });

  const logoUrl = getValues("logoUrl");
  const faviconUrl = getValues("faviconUrl");
  const appIconUrl = getValues("appIconUrl");

  const handleBlur = (
    url: string,
    formElement: "logoUrl" | "faviconUrl" | "appIconUrl",
  ) => {
    const trimmedUrl = url.trim();
    if (trimmedUrl !== url) {
      setValue(formElement, trimmedUrl);
    }
  };

  useEffect(() => {
    handleBlur(logoUrl, "logoUrl");
    handleBlur(faviconUrl, "faviconUrl");
    handleBlur(appIconUrl, "appIconUrl");
  }, [logoUrl, faviconUrl, appIconUrl]);

  const save = async () => {
    const updatedRealm = {
      ...realm,
      attributes: {
        ...realm!.attributes,
        "_providerConfig.assets.logo.url": logoUrl,
        "_providerConfig.assets.favicon.url": faviconUrl,
        "_providerConfig.assets.appicon.url": appIconUrl,
      },
    };

    if (logoUrl.length === 0) {
      //@ts-ignore
      delete updatedRealm["attributes"]["_providerConfig.assets.logo.url"];
    }
    if (faviconUrl.length === 0) {
      //@ts-ignore
      delete updatedRealm["attributes"]["_providerConfig.assets.favicon.url"];
    }
    if (appIconUrl.length === 0) {
      //@ts-ignore
      delete updatedRealm["attributes"]["_providerConfig.assets.appicon.url"];
    }

    try {
      await adminClient.realms.update(
        { realm: realm.realm as string },
        updatedRealm,
      );
      addAlert("Attributes for realm have been updated.", AlertVariant.success);
      refresh();
    } catch (e) {
      console.error("Could not update realm with attributes.", e);
      addError("Failed to update realm.", e);
    }
  };

  const LogoUrlBrand = (
    <LogoContainer title={t("logoUrlPreview")}>
      {logoUrl ? (
        logoUrlError ? (
          <InvalidImageError />
        ) : (
          <Brand
            src={logoUrl}
            alt="Custom Logo"
            widths={{ default: "200px" }}
          ></Brand>
        )
      ) : (
        <ImageInstruction name="Logo" />
      )}
    </LogoContainer>
  );

  const FaviconUrlBrand = (
    <LogoContainer title={t("faviconUrlPreview")}>
      {faviconUrl ? (
        faviconUrlError ? (
          <InvalidImageError />
        ) : (
          <Brand
            src={faviconUrl}
            alt="Favicon"
            widths={{ default: "200px" }}
          ></Brand>
        )
      ) : (
        <ImageInstruction name="Favicon" />
      )}
    </LogoContainer>
  );

  const AppIconUrlBrand = (
    <LogoContainer title={t("appIconUrlPreview")}>
      {appIconUrl ? (
        appIconUrlError ? (
          <InvalidImageError />
        ) : (
          <Brand
            src={appIconUrl}
            alt="App Icon"
            widths={{ default: "200px" }}
          ></Brand>
        )
      ) : (
        <ImageInstruction name="App Icon" />
      )}
    </LogoContainer>
  );

  return (
    <PageSection variant="light" className="keycloak__form">
      <Alert
        variant="info"
        title={t("generalStylesAlertTitle")}
        isInline
        className="pf-v5-u-mb-lg"
      >
        <p>{t("generalStylesAlertBody")}</p>
      </Alert>
      <Form isHorizontal id="general-styles">
        <FormProvider {...form}>
          <TextControl
            type="url"
            label={t("logoUrl")}
            labelIcon={t("formHelpLogoUrl")}
            id="kc-styles-logo-url"
            data-testid="kc-styles-logo-url"
            name="logoUrl"
          />
          <FormGroup fieldId="kc-styles-logo-url">
            {LogoUrlBrand}
            {logoUrl && (
              <img
                className="pf-v5-u-display-none"
                src={logoUrl}
                onError={() => isValidUrl(false, "logoUrl", setLogoUrlError)}
                onLoad={() => isValidUrl(true, "logoUrl", setLogoUrlError)}
              ></img>
            )}
            <span style={{ fontSize: 13 }} className="pf-v5-u-color-400">
              This logo is used for login and account pages. To set a separate
              logo for emails, go to{" "}
              <Link to={toStyles({ realm: realmName, tab: "email" })}>
                Styles &rsaquo; Email
              </Link>
              .
            </span>
          </FormGroup>

          <TextControl
            type="url"
            id="kc-styles-favicon-url"
            name="faviconUrl"
            label={t("faviconUrl")}
            labelIcon={t("formHelpFaviconUrl")}
            data-testid="kc-styles-favicon-url"
          />
          <FormGroup>
            {FaviconUrlBrand}
            {faviconUrl && (
              <img
                className="pf-v5-u-display-none"
                src={faviconUrl}
                onError={() =>
                  isValidUrl(false, "faviconUrl", setFaviconUrlError)
                }
                onLoad={() =>
                  isValidUrl(true, "faviconUrl", setFaviconUrlError)
                }
              ></img>
            )}
          </FormGroup>

          <TextControl
            type="url"
            id="kc-styles-appicon-url"
            label={t("appIconUrl")}
            labelIcon={t("formHelpAppIconUrl")}
            data-testid="kc-styles-appicon-url"
            name="appIconUrl"
          />
          <FormGroup>
            {AppIconUrlBrand}
            {appIconUrl && (
              <img
                className="pf-v5-u-display-none"
                src={appIconUrl}
                onError={() =>
                  isValidUrl(false, "appIconUrl", setAppIconUrlError)
                }
                onLoad={() =>
                  isValidUrl(true, "appIconUrl", setAppIconUrlError)
                }
              ></img>
            )}
          </FormGroup>

          <SaveReset
            name="generalStyles"
            save={save}
            reset={reset}
            isActive={isDirty}
          />
        </FormProvider>
      </Form>
    </PageSection>
  );
};
