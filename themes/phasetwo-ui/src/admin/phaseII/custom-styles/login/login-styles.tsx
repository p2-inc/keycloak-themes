import {
  Alert,
  AlertVariant,
  ExpandableSection,
  Flex,
  FlexItem,
  Form,
  PageSection,
  Title,
} from "@patternfly/react-core";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TextAreaControl, TextControl } from "@/shared/keycloak-ui-shared";
import { SaveReset } from "../components/SaveReset";
import { useEffect, useState } from "react";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import { useAlerts } from "@/shared/keycloak-ui-shared";

import { ColorPicker } from "../components/ColorPicker";
import { useAdminClient } from "../../../admin-client";
import { useEnvironment } from "@/shared/keycloak-ui-shared";
import { useRealm } from "../../../context/realm-context/RealmContext";
import type { Environment } from "../../../environment";
import {
  BASE_TOKENS,
  darkTokenName,
  FONT_FAMILY_ATTR_KEY,
  isValidColor,
  isValidLength,
  LEGACY_LOGIN_PREFIX,
  RADIUS_ATTR_KEY,
  readToken,
  v2AttrKey,
  type BaseToken,
} from "./theme-tokens";

/**
 * Two independent sets of fields live on this tab, because the panel serves every
 * login theme the jar ships:
 *
 * - **Brand tokens** (`theme.v2.*`) drive `phasetwo-ui`, the shadcn login theme. The
 *   server resolves and expands them into the full shadcn variable set.
 * - **Legacy colors** (`assets.login.*Color`) drive the PatternFly `attributes` and
 *   `attributes-v2` themes, which have no notion of tokens. They are also the
 *   fallback the brand tokens resolve through, so a realm that only ever set these
 *   still renders correctly under `phasetwo-ui`.
 *
 * Keeping both is deliberate: dropping the legacy fields would leave realms on the
 * PatternFly themes with no way to change their colors.
 */

type LoginStylesType = Record<string, string>;

const RADIUS_FIELD = "radius";
const FONT_FAMILY_FIELD = "fontFamily";
const CSS_FIELD = "css";

const LEGACY_COLOR_FIELDS = [
  "primaryColor",
  "secondaryColor",
  "backgroundColor",
] as const;

const HexColorPattern = /^#([0-9a-f]{3}){1,2}$/;

type LoginStylesArgs = {
  refresh: () => void;
  realm: RealmRepresentation;
};

/** A color row: swatch on the left, free-text CSS value on the right. */
const ColorField = ({
  name,
  label,
  labelIcon,
  value,
  onPick,
}: {
  name: string;
  label: string;
  labelIcon: string;
  value: string;
  onPick: (color: string) => void;
}) => (
  <Flex alignItems={{ default: "alignItemsCenter" }}>
    <FlexItem>
      <ColorPicker color={value} onChange={onPick} />
    </FlexItem>
    <FlexItem grow={{ default: "grow" }}>
      <TextControl
        type="text"
        id={name}
        name={name}
        data-testid={name}
        label={label}
        labelIcon={labelIcon}
        rules={{
          validate: (v: string) =>
            !v || isValidColor(v) || labelIcon,
        }}
        placeholder="#000000"
      />
    </FlexItem>
  </Flex>
);

export const LoginStyles = ({ refresh, realm }: LoginStylesArgs) => {
  const { t } = useTranslation();
  const { adminClient } = useAdminClient();
  const { environment } = useEnvironment<Environment>();
  const { realm: realmName } = useRealm();
  const accountConsoleUrl = `${environment.serverBaseUrl}/realms/${realmName}/account`;
  const { addAlert, addError } = useAlerts();
  const [darkExpanded, setDarkExpanded] = useState(false);
  const [legacyExpanded, setLegacyExpanded] = useState(false);

  const form = useForm<LoginStylesType>({ defaultValues: {} });
  const { getValues, setValue } = form;

  // Watch the whole form so every swatch re-renders as its text field changes,
  // rather than registering a useWatch per field.
  const values = useWatch({ control: form.control }) as LoginStylesType;

  function loadRealm() {
    const attributes = realm?.attributes as
      | Record<string, string>
      | undefined;

    for (const token of BASE_TOKENS) {
      setValue(token, readToken(attributes, token, false));
      setValue(darkTokenName(token), readToken(attributes, token, true));
    }

    setValue(RADIUS_FIELD, attributes?.[RADIUS_ATTR_KEY] ?? "");
    setValue(FONT_FAMILY_FIELD, attributes?.[FONT_FAMILY_ATTR_KEY] ?? "");

    for (const field of LEGACY_COLOR_FIELDS) {
      setValue(field, attributes?.[`${LEGACY_LOGIN_PREFIX}${field}`] ?? "");
    }
    setValue(CSS_FIELD, attributes?.[`${LEGACY_LOGIN_PREFIX}css`] ?? "");
  }

  useEffect(() => {
    loadRealm();
  }, []);

  /** Set the attribute, or drop the key entirely when the value is blank. */
  const setOrDelete = (
    attributes: Record<string, string>,
    key: string,
    value: string | undefined,
  ) => {
    const trimmed = (value ?? "").trim();
    if (trimmed.length > 0) {
      attributes[key] = trimmed;
    } else {
      delete attributes[key];
    }
  };

  const generateUpdatedRealm = (): RealmRepresentation => {
    const current = getValues();
    const attributes: Record<string, string> = {
      ...(realm.attributes as Record<string, string> | undefined),
    };

    // Brand tokens are written to the shared v2 namespace only. The legacy keys are
    // not mirrored: they belong to the PatternFly themes and are edited below.
    for (const token of BASE_TOKENS) {
      setOrDelete(attributes, v2AttrKey(token, false), current[token]);
      setOrDelete(
        attributes,
        v2AttrKey(token, true),
        current[darkTokenName(token)],
      );
    }
    setOrDelete(attributes, RADIUS_ATTR_KEY, current[RADIUS_FIELD]);
    setOrDelete(attributes, FONT_FAMILY_ATTR_KEY, current[FONT_FAMILY_FIELD]);

    for (const field of LEGACY_COLOR_FIELDS) {
      setOrDelete(
        attributes,
        `${LEGACY_LOGIN_PREFIX}${field}`,
        current[field],
      );
    }
    setOrDelete(attributes, `${LEGACY_LOGIN_PREFIX}css`, current[CSS_FIELD]);

    return { ...realm, attributes };
  };

  const save = async () => {
    const updatedRealm = generateUpdatedRealm();
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

  const tokenField = (token: BaseToken, dark: boolean) => {
    const name = dark ? darkTokenName(token) : token;
    return (
      <ColorField
        key={name}
        name={name}
        label={t(`brandToken_${token}`)}
        labelIcon={t(`brandToken_${token}Help`)}
        value={values[name] ?? ""}
        onPick={(color) => setValue(name, color, { shouldDirty: true })}
      />
    );
  };

  return (
    <PageSection variant="light" className="keycloak__form">
      <Alert
        variant="info"
        title={t("loginThemeActivationAlertTitle")}
        isInline
        className="pf-v5-u-mb-lg"
      >
        <p>
          <strong>Brand tokens</strong> apply to the <code>phasetwo-ui</code>{" "}
          login theme only — select it as the <strong>Login</strong> theme in
          Realm Settings &gt; Themes for them to take effect. The{" "}
          <strong>legacy colors</strong> below apply to the older{" "}
          <code>attributes</code> and <code>attributes-v2</code> themes, and
          act as a fallback for the brand tokens.
        </p>
      </Alert>
      <Alert
        variant="info"
        title={t("loginPreviewAlertTitle")}
        isInline
        className="pf-v5-u-mb-lg"
      >
        <p>
          View the{" "}
          <a href={accountConsoleUrl} target="_blank" rel="noopener noreferrer">
            {t("loginPreviewAlertBodyAccountConsole")}
          </a>{" "}
          to preview login page changes. For accurate results, open in an{" "}
          <strong>{t("loginPreviewAlertBodyIncognito")}</strong> or a separate
          browser session to be presented with a Login page.
        </p>
      </Alert>
      <Form isHorizontal>
        <FormProvider {...form}>
          <Title headingLevel="h2" size="md">
            {t("brandTokensTitle")}
          </Title>
          <p className="pf-v5-u-color-200">{t("brandTokensDescription")}</p>

          {BASE_TOKENS.map((token) => tokenField(token, false))}

          <TextControl
            type="text"
            id={RADIUS_FIELD}
            name={RADIUS_FIELD}
            data-testid={RADIUS_FIELD}
            label={t("brandTokenRadius")}
            labelIcon={t("brandTokenRadiusHelp")}
            rules={{
              validate: (v: string) =>
                !v || isValidLength(v) || t("brandTokenRadiusHelp"),
            }}
            placeholder="0.625rem"
          />
          <TextControl
            type="text"
            id={FONT_FAMILY_FIELD}
            name={FONT_FAMILY_FIELD}
            data-testid={FONT_FAMILY_FIELD}
            label={t("brandTokenFontFamily")}
            labelIcon={t("brandTokenFontFamilyHelp")}
            placeholder='"Inter", ui-sans-serif, system-ui, sans-serif'
          />

          <ExpandableSection
            toggleText={t("brandTokensDarkToggle")}
            onToggle={(_event, expanded) => setDarkExpanded(expanded)}
            isExpanded={darkExpanded}
          >
            <p className="pf-v5-u-color-200 pf-v5-u-mb-md">
              {t("brandTokensDarkDescription")}
            </p>
            {BASE_TOKENS.map((token) => tokenField(token, true))}
          </ExpandableSection>

          <ExpandableSection
            toggleText={t("legacyColorsToggle")}
            onToggle={(_event, expanded) => setLegacyExpanded(expanded)}
            isExpanded={legacyExpanded}
          >
            <p className="pf-v5-u-color-200 pf-v5-u-mb-md">
              {t("legacyColorsDescription")}
            </p>
            {LEGACY_COLOR_FIELDS.map((field) => (
              <Flex key={field} alignItems={{ default: "alignItemsCenter" }}>
                <FlexItem>
                  <ColorPicker
                    color={values[field] ?? ""}
                    onChange={(color) =>
                      setValue(field, color, { shouldDirty: true })
                    }
                  />
                </FlexItem>
                <FlexItem grow={{ default: "grow" }}>
                  <TextControl
                    type="text"
                    id={field}
                    name={field}
                    data-testid={field}
                    label={t(field)}
                    labelIcon={t(`${field}Help`)}
                    rules={{
                      pattern: {
                        value: HexColorPattern,
                        message: t(`${field}Help`),
                      },
                    }}
                    placeholder="#000000"
                  />
                </FlexItem>
              </Flex>
            ))}
          </ExpandableSection>

          <TextAreaControl
            id={CSS_FIELD}
            name={CSS_FIELD}
            data-testid={CSS_FIELD}
            label={t("css")}
            rows={10}
          />
          <SaveReset name="generalStyles" save={save} reset={loadRealm} />
        </FormProvider>
      </Form>
    </PageSection>
  );
};
