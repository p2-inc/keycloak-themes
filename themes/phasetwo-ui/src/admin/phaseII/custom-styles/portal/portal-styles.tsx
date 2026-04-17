import {
  Alert,
  AlertVariant,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  Divider,
  Form,
  PageSection,
  Title,
} from "@patternfly/react-core";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { HelpItem, TextAreaControl } from "@/shared/keycloak-ui-shared";
import { SaveReset } from "../components/SaveReset";
import { useEffect } from "react";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import { get, mapKeys, pick } from "lodash-es";
import { useAlerts, useEnvironment } from "@/shared/keycloak-ui-shared";

import { useAdminClient } from "../../../admin-client";
import ColorFormGroup from "../components/color-form-group";
import { FormattedLink } from "../../../components/external-link/FormattedLink";
import helpUrls from "../../../help-urls";
import { useRealm } from "../../../context/realm-context/RealmContext";
import type { Environment } from "../../../environment";

import "./portal-styles.css";

export type PortalStylesTypeColors = {
  primaryColor100: string;
  primaryColor200: string;
  primaryColor400: string;
  primaryColor500: string;
  primaryColor600: string;
  primaryColor700: string;
  primaryColor900: string;
  secondaryColor800: string;
  secondaryColor900: string;
};

type PortalStylesTypeColorsKeys = keyof PortalStylesTypeColors;

const colorKeys: PortalStylesTypeColorsKeys[] = [
  "primaryColor100",
  "primaryColor200",
  "primaryColor400",
  "primaryColor500",
  "primaryColor600",
  "primaryColor700",
  "primaryColor900",
  "secondaryColor800",
  "secondaryColor900",
];

export type PortalStylesType = PortalStylesTypeColors & {
  css: string;
  portal_profile_enabled: boolean;
  portal_profile_password_enabled: boolean;
  portal_profile_twofactor_enabled: boolean;
  portal_profile_activity_enabled: boolean;
  portal_profile_linked_enabled: boolean;
  portal_org_enabled: boolean;
  portal_org_details_enabled: boolean;
  portal_org_members_enabled: boolean;
  portal_org_invitations_enabled: boolean;
  portal_org_domains_enabled: boolean;
  portal_org_sso_enabled: boolean;
  portal_org_events_enabled: boolean;
};

type PortalStylesKeys = keyof PortalStylesType;

type PortalStylesArgs = {
  refresh: () => void;
  realm: RealmRepresentation;
};

const visiblityProfileItems: PortalStylesKeys[] = [
  "portal_profile_enabled",
  "portal_profile_password_enabled",
  "portal_profile_twofactor_enabled",
  "portal_profile_activity_enabled",
  "portal_profile_linked_enabled",
];
const visiblityOrganizationItems: PortalStylesKeys[] = [
  "portal_org_enabled",
  "portal_org_details_enabled",
  "portal_org_members_enabled",
  "portal_org_invitations_enabled",
  "portal_org_domains_enabled",
  "portal_org_sso_enabled",
  "portal_org_events_enabled",
];
const visibilityItems = [
  ...visiblityProfileItems,
  ...visiblityOrganizationItems,
];

export const PortalStyles = ({ refresh, realm }: PortalStylesArgs) => {
  const { t } = useTranslation();
  const { adminClient } = useAdminClient();
  const { addAlert, addError } = useAlerts();
  const { environment } = useEnvironment<Environment>();
  const { realm: realmName } = useRealm();
  const portalUrl = `${environment.serverBaseUrl}/realms/${realmName}/portal`;
  const form = useForm<PortalStylesType>({
    defaultValues: {
      primaryColor100: "",
      primaryColor200: "",
      primaryColor400: "",
      primaryColor500: "",
      primaryColor600: "",
      primaryColor700: "",
      primaryColor900: "",
      secondaryColor800: "",
      secondaryColor900: "",
      css: "",
      portal_profile_enabled: false,
      portal_profile_password_enabled: false,
      portal_profile_twofactor_enabled: false,
      portal_profile_activity_enabled: false,
      portal_profile_linked_enabled: false,
      portal_org_enabled: false,
      portal_org_details_enabled: false,
      portal_org_members_enabled: false,
      portal_org_invitations_enabled: false,
      portal_org_domains_enabled: false,
      portal_org_sso_enabled: false,
      portal_org_events_enabled: false,
    },
  });
  const {
    register,
    control,
    getValues,
    setValue,
    resetField,
    formState: { errors },
  } = form;

  async function loadRealm() {
    const realmInfo = realm;

    colorKeys.map((k) => {
      setValue(
        k,
        get(realmInfo?.attributes, `_providerConfig.assets.portal.${k}`, ""),
      );
    });

    setValue(
      "css",
      get(realmInfo?.attributes, "_providerConfig.assets.portal.css", ""),
    );

    visibilityItems.map((pi) => {
      const pth = pi.replaceAll("_", ".");
      let val = get(realmInfo?.attributes, `_providerConfig.${pth}`, true);
      if (val === "true") val = true;
      if (val === "false") val = false;
      setValue(pi, val);
    });
  }

  useEffect(() => {
    loadRealm();
  }, []);

  const addOrRemoveItem = (
    key: string,
    value: string,
    fullObj: RealmRepresentation,
  ) => {
    let updatedObj = { ...fullObj };
    const fullKeyPath = `_providerConfig.${key}`;
    if (value.length > 0) {
      updatedObj = {
        ...updatedObj,
        attributes: {
          ...updatedObj!.attributes,
          [fullKeyPath]: value,
        },
      };
    } else {
      // @ts-expect-error: possibly undefined
      delete updatedObj["attributes"][fullKeyPath];
    }
    return updatedObj;
  };

  const saveBranding = async () => {
    const { css } = getValues();
    let updatedRealm = { ...realm };

    colorKeys.forEach((k) => {
      updatedRealm = addOrRemoveItem(
        `assets.portal.${k}`,
        getValues(k),
        updatedRealm,
      );
    });
    updatedRealm = addOrRemoveItem("assets.portal.css", css, updatedRealm);

    try {
      await adminClient.realms.update(
        { realm: realm.realm as string },
        updatedRealm,
      );
      addAlert("Branding updated.", AlertVariant.success);
      refresh();
    } catch (e) {
      console.error("Could not update realm with attributes.", e);
      addError("Failed to update realm.", e);
    }
  };

  const resetBranding = () => {
    colorKeys.forEach((k) => resetField(k));
    resetField("css");
  };

  const saveVisibility = async () => {
    const values = getValues();
    const portalItems = pick(values, visibilityItems);
    const newPortalItems = mapKeys(
      portalItems,
      (_value, key) => `_providerConfig.${(key as string).replaceAll("_", ".")}`,
    );

    const updatedRealm = {
      ...realm,
      attributes: {
        ...realm!.attributes,
        ...newPortalItems,
      },
    };

    try {
      await adminClient.realms.update(
        { realm: realm.realm as string },
        updatedRealm,
      );
      addAlert("Visibility settings updated.", AlertVariant.success);
      refresh();
    } catch (e) {
      console.error("Could not update realm with attributes.", e);
      addError("Failed to update realm.", e);
    }
  };

  const resetVisibility = () => {
    visibilityItems.forEach((i) => resetField(i));
  };

  // To get color picker to update when text input is changed
  useWatch({
    name: "primaryColor100",
    control,
  });
  useWatch({
    name: "primaryColor200",
    control,
  });
  useWatch({
    name: "primaryColor400",
    control,
  });
  useWatch({
    name: "primaryColor500",
    control,
  });
  useWatch({
    name: "primaryColor600",
    control,
  });
  useWatch({
    name: "primaryColor700",
    control,
  });
  useWatch({
    name: "primaryColor900",
    control,
  });
  useWatch({
    name: "secondaryColor800",
    control,
  });
  useWatch({
    name: "secondaryColor900",
    control,
  });

  return (
    <PageSection variant="light" className="keycloak__form portal-styles">
      <Alert
        variant="info"
        title={t("portalInfoAlertTitle")}
        isInline
        className="pf-v5-u-mb-lg"
      >
        <p>
          {t("portalInfoAlertBody")}{" "}
          <a href={portalUrl} target="_blank" rel="noopener noreferrer">
            {t("portalInfoAlertBodyOpenPortal")}
          </a>{" "}
          <FormattedLink
            title={t("learnMore")}
            href={helpUrls.adminPortalUrl}
            isInline
          />
        </p>
      </Alert>
      <Form isHorizontal>
        <FormProvider {...form}>
          {/* Branding Section */}
          <Card isFlat isCompact className="pf-v5-u-mb-lg">
            <CardTitle>
              <Title headingLevel="h3" className="pf-c-title pf-m-xl">
                {t("branding")}
              </Title>
            </CardTitle>
            <CardBody>
              <Form isHorizontal>
                <p className="pf-v5-u-mb-md">
                  {t("portalBrandingColorHelp")}
                </p>

                {colorKeys.map((k) => (
                  <ColorFormGroup
                    key={k}
                    colorKey={k}
                    {...{ register, errors, getValues, setValue }}
                  />
                ))}

                {/* CSS */}
                <TextAreaControl
                  id="kc-styles-logo-url"
                  name="css"
                  label={t("css")}
                  labelIcon={t("cssHelp")}
                  type="text"
                  data-testid="kc-styles-logo-url"
                  rules={{ required: true }}
                />
              </Form>
              <SaveReset
                name="brandingStyles"
                save={saveBranding}
                reset={resetBranding}
              />
            </CardBody>
          </Card>

          {/* Visibility Section */}
          <Card isFlat isCompact className="pf-v5-u-mb-lg">
            <CardTitle>
              <Title headingLevel="h3" className="pf-c-title pf-m-xl">
                {t("portalVisibilityCardTitle")}
              </Title>
            </CardTitle>
            <CardBody>
              <Alert
                variant="info"
                title={t("portalFeatureFlagsAlertTitle")}
                isInline
                className="pf-v5-u-mb-lg"
              >
                <p>
                  {t("portalFeatureFlagsAlertBody")}
                </p>
              </Alert>

              {/*   Profile */}
              <div className="pf-v5-u-mb-xs pf-v5-u-mt-sm">
                <Title headingLevel="h4" className="pf-c-title pf-m-md">
                  {t("profile")}
                </Title>
                <Divider className="pf-v5-u-mt-xs" />
              </div>
              <Form isHorizontal className="pf-v5-u-mb-lg pf-v5-u-pl-md">
                {visiblityProfileItems.map((i) => (
                  <Controller
                    name={i}
                    key={i}
                    control={control}
                    render={({ field, field: { value } }) => (
                      <div className="pf-v5-l-flex pf-m-align-items-center">
                        {/* @ts-ignore */}
                        <Checkbox id={i} label={t(i)} isChecked={value} {...field} />
                        <HelpItem helpText={t(`${i}_tooltip`)} fieldLabelId={i} />
                      </div>
                    )}
                  />
                ))}
              </Form>

              {/*   Organizations */}
              <div className="pf-v5-u-mb-xs">
                <Title headingLevel="h4" className="pf-c-title pf-m-md">
                  {t("organizations")}
                </Title>
                <Divider className="pf-v5-u-mt-xs" />
              </div>
              <Form isHorizontal className="pf-v5-u-pl-md">
                {visiblityOrganizationItems.map((i) => (
                  <Controller
                    name={i}
                    key={i}
                    control={control}
                    render={({ field, field: { value } }) => (
                      <div className="pf-v5-l-flex pf-m-align-items-center">
                        {/* @ts-ignore */}
                        <Checkbox id={i} label={t(i)} isChecked={value} {...field} />
                        <HelpItem helpText={t(`${i}_tooltip`)} fieldLabelId={i} />
                      </div>
                    )}
                  />
                ))}
              </Form>
              <SaveReset
                name="visibilityStyles"
                save={saveVisibility}
                reset={resetVisibility}
              />
            </CardBody>
          </Card>

        </FormProvider>
      </Form>
    </PageSection>
  );
};
