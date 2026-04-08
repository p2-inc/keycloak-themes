import {
  Alert,
  AlertVariant,
  Checkbox,
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
import { useAlerts } from "@/shared/keycloak-ui-shared";

import { useAdminClient } from "../../../admin-client";
import ColorFormGroup from "../components/color-form-group";
import { FormattedLink } from "../../../components/external-link/FormattedLink";
import helpUrls from "../../../help-urls";

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
    reset,
    getValues,
    setValue,
    formState: { errors, isDirty },
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

  const updatePortalValues = (
    portalValues: PortalStylesType,
    fullObj: RealmRepresentation,
  ) => {
    const portalItems = pick(portalValues, visibilityItems);
    const newPortalItems = mapKeys(
      portalItems,
      (_value, key) => `_providerConfig.${key.replaceAll("_", ".")}`,
    );

    return {
      ...fullObj,
      attributes: {
        ...fullObj!.attributes,
        ...newPortalItems,
      },
    };
  };

  const generateUpdatedRealm = () => {
    const { css, ...portalValues } = getValues();

    let updatedRealm = {
      ...realm,
    };

    // @ts-ignore
    updatedRealm = updatePortalValues(portalValues, updatedRealm);

    colorKeys.map((k) => {
      updatedRealm = addOrRemoveItem(
        `assets.portal.${k}`,
        getValues(k),
        updatedRealm,
      );
    });

    updatedRealm = addOrRemoveItem("assets.portal.css", css, updatedRealm);

    return updatedRealm;
  };

  const save = async () => {
    // update realm with new attributes
    const updatedRealm = generateUpdatedRealm();

    // save values
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
        title="Admin Portal"
        isInline
        className="pf-v5-u-mb-lg"
      >
        <p>
          Learn more about how the Admin Portal works and how to customize it.
          Launch the &quot;admin portal&quot; client from the client list to see
          the portal in action.{" "}
          <FormattedLink
            title={t("learnMore")}
            href={helpUrls.adminPortalUrl}
            isInline
          />
        </p>
      </Alert>
      <Form isHorizontal>
        <FormProvider {...form}>
          <Title headingLevel="h3" className="pf-c-title pf-m-xl">
            {t("branding")}
          </Title>
          <p>
            Follows Tailwind CSS{" "}
            <a
              href="https://tailwindcss.com/docs/theme#colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              color
            </a>{" "}
            naming convention. There are custom defined colors available for
            configuration below.
          </p>

          {/* Primary Color */}
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

          {/* Visibility  */}
          <Title headingLevel="h3" className="pf-c-title pf-m-xl">
            {t("visibility")}
          </Title>

          {/*   Profile */}
          <Title headingLevel="h4" className="pf-c-title pf-m-lg">
            {t("profile")}
          </Title>
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

          {/*   Organizations */}
          <Title headingLevel="h4" className="pf-c-title pf-m-lg">
            {t("organizations")}
          </Title>
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
