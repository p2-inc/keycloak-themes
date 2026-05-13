import { useEffect, useState } from "react";
import {
  ActionGroup,
  AlertVariant,
  Button,
  ClipboardCopy,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Switch,
  TextInput,
} from "@patternfly/react-core";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAlerts, useEnvironment } from "@/shared/keycloak-ui-shared";

import { useRealm } from "../../context/realm-context/RealmContext";
import type { Environment } from "../../environment";
import useOrgFetcher, {
  type OrganizationScimRepresentation,
} from "./useOrgFetcher";
import type { OrgRepresentation } from "./routes";

type OrgScimProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

type ScimAuthType =
  | "KEYCLOAK"
  | "EXTERNAL_JWT"
  | "EXTERNAL_SECRET"
  | "EXTERNAL_BASIC";

type ScimFormValues = {
  enabled: boolean;
  emailAsUsername: boolean;
  linkIdp: boolean;
  authType: ScimAuthType;
  issuer: string;
  audience: string;
  jwksUri: string;
  sharedSecret: string;
  basicUsername: string;
  basicPassword: string;
};

const defaultFormValues: ScimFormValues = {
  enabled: true,
  emailAsUsername: false,
  linkIdp: false,
  authType: "KEYCLOAK",
  issuer: "",
  audience: "",
  jwksUri: "",
  sharedSecret: "",
  basicUsername: "",
  basicPassword: "",
};

function representationToForm(
  rep: OrganizationScimRepresentation,
): ScimFormValues {
  const auth = rep.auth;
  const values: ScimFormValues = {
    ...defaultFormValues,
    enabled: rep.enabled ?? true,
    emailAsUsername: rep.email_as_username ?? false,
    linkIdp: rep.link_idp ?? false,
  };

  if (auth) {
    values.authType = auth.type;
    if (auth.type === "EXTERNAL_JWT") {
      values.issuer = auth.issuer ?? "";
      values.audience = auth.audience ?? "";
      values.jwksUri = auth.jwks_uri ?? "";
    } else if (auth.type === "EXTERNAL_BASIC") {
      values.basicUsername = auth.username ?? "";
      // basicPassword stays blank -- the existing hash is shown read-only
      // separately, and a blank input preserves it server-side
    }
    // sharedSecret stays blank for the same reason as basicPassword above
  }

  return values;
}

function formToRepresentation(
  values: ScimFormValues,
  existing: OrganizationScimRepresentation | null,
): OrganizationScimRepresentation {
  const rep: OrganizationScimRepresentation = {
    enabled: values.enabled,
    email_as_username: values.emailAsUsername,
    link_idp: values.linkIdp,
  };

  switch (values.authType) {
    case "KEYCLOAK":
      rep.auth = { type: "KEYCLOAK" };
      break;
    case "EXTERNAL_JWT":
      rep.auth = {
        type: "EXTERNAL_JWT",
        issuer: values.issuer || undefined,
        audience: values.audience || undefined,
        jwks_uri: values.jwksUri || undefined,
      };
      break;
    case "EXTERNAL_SECRET": {
      // Only include shared_secret when the user has entered something,
      // otherwise the existing hashed value is preserved server-side.
      const existingSecret =
        existing?.auth?.type === "EXTERNAL_SECRET"
          ? existing.auth.shared_secret
          : undefined;
      rep.auth = {
        type: "EXTERNAL_SECRET",
        shared_secret: values.sharedSecret || existingSecret || undefined,
      };
      break;
    }
    case "EXTERNAL_BASIC": {
      const existingPassword =
        existing?.auth?.type === "EXTERNAL_BASIC"
          ? existing.auth.password
          : undefined;
      rep.auth = {
        type: "EXTERNAL_BASIC",
        username: values.basicUsername || undefined,
        password: values.basicPassword || existingPassword || undefined,
      };
      break;
    }
  }

  return rep;
}

export default function OrgScim({ org, refresh }: OrgScimProps) {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { addAlert } = useAlerts();
  const { environment } = useEnvironment<Environment>();
  const {
    getScimConfig,
    createScimConfig,
    updateScimConfig,
    deleteScimConfig,
  } = useOrgFetcher(realm);

  const scimUrl = `${environment.serverBaseUrl}/realms/${realm}/scim/v2/organizations/${org.id}/`;

  const [existingConfig, setExistingConfig] =
    useState<OrganizationScimRepresentation | null>(null);
  const [loaded, setLoaded] = useState(false);

  const form = useForm<ScimFormValues>({
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = form;

  const authType = watch("authType");
  const sharedSecretMasked = existingConfig?.auth?.type === "EXTERNAL_SECRET"
    ? existingConfig.auth.shared_secret ?? ""
    : "";
  const basicPasswordMasked = existingConfig?.auth?.type === "EXTERNAL_BASIC"
    ? existingConfig.auth.password ?? ""
    : "";

  async function load() {
    const cfg = await getScimConfig(org.id);
    setExistingConfig(cfg);
    if (cfg) {
      reset(representationToForm(cfg));
    } else {
      reset(defaultFormValues);
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id]);

  const onSubmit = async (values: ScimFormValues) => {
    const rep = formToRepresentation(values, existingConfig);
    const res = existingConfig
      ? await updateScimConfig(org.id, rep)
      : await createScimConfig(org.id, rep);

    if ("success" in res && res.success) {
      addAlert(res.message);
      await load();
      refresh();
    } else if ("message" in res) {
      addAlert(res.message, AlertVariant.danger);
    }
  };

  const onDelete = async () => {
    if (!existingConfig) return;
    const res = await deleteScimConfig(org.id);
    if ("success" in res && res.success) {
      addAlert(res.message);
      await load();
      refresh();
    } else if ("message" in res) {
      addAlert(res.message, AlertVariant.danger);
    }
  };

  if (!loaded) return <div></div>;

  return (
    <Grid hasGutter className="pf-v5-u-px-lg pf-v5-u-mt-xl">
      <GridItem span={8}>
        <FormProvider {...form}>
          <Form isHorizontal onSubmit={handleSubmit(onSubmit)}>
            <FormGroup label="Enabled" fieldId="enabled">
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="enabled"
                    isChecked={field.value}
                    onChange={(_e, checked) => field.onChange(checked)}
                    label="On"
                    labelOff="Off"
                  />
                )}
              />
            </FormGroup>

            {existingConfig && (
              <>
                <FormGroup label="ID" fieldId="scim-id">
                  <ClipboardCopy
                    id="scim-id"
                    isReadOnly
                    hoverTip="Copy"
                    clickTip="Copied"
                  >
                    {org.id}
                  </ClipboardCopy>
                </FormGroup>
                <FormGroup label="SCIM URL" fieldId="scim-url">
                  <ClipboardCopy
                    id="scim-url"
                    isReadOnly
                    hoverTip="Copy"
                    clickTip="Copied"
                  >
                    {scimUrl}
                  </ClipboardCopy>
                </FormGroup>
              </>
            )}

            <FormGroup label="Use email as username" fieldId="emailAsUsername">
              <Controller
                name="emailAsUsername"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="emailAsUsername"
                    isChecked={field.value}
                    onChange={(_e, checked) => field.onChange(checked)}
                    label="On"
                    labelOff="Off"
                  />
                )}
              />
            </FormGroup>

            <FormGroup label="Link Identity Provider" fieldId="linkIdp">
              <Controller
                name="linkIdp"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="linkIdp"
                    isChecked={field.value}
                    onChange={(_e, checked) => field.onChange(checked)}
                    label="On"
                    labelOff="Off"
                  />
                )}
              />
            </FormGroup>

            <FormGroup label="Authentication" fieldId="authType" isRequired>
              <Controller
                name="authType"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    id="authType"
                    value={field.value}
                    onChange={(_e, value) => field.onChange(value)}
                    aria-label="Authentication type"
                  >
                    <FormSelectOption value="KEYCLOAK" label="Keycloak service account" />
                    <FormSelectOption value="EXTERNAL_JWT" label="External JWT (JWKS)" />
                    <FormSelectOption value="EXTERNAL_SECRET" label="External shared secret (bearer token)" />
                    <FormSelectOption value="EXTERNAL_BASIC" label="External basic auth" />
                  </FormSelect>
                )}
              />
            </FormGroup>

            {authType === "EXTERNAL_JWT" && (
              <>
                <FormGroup label="Issuer" fieldId="issuer">
                  <Controller
                    name="issuer"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        id="issuer"
                        value={field.value}
                        onChange={(_e, value) => field.onChange(value)}
                      />
                    )}
                  />
                </FormGroup>
                <FormGroup label="Audience" fieldId="audience">
                  <Controller
                    name="audience"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        id="audience"
                        value={field.value}
                        onChange={(_e, value) => field.onChange(value)}
                      />
                    )}
                  />
                </FormGroup>
                <FormGroup label="JWKS URI" fieldId="jwksUri">
                  <Controller
                    name="jwksUri"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        id="jwksUri"
                        value={field.value}
                        onChange={(_e, value) => field.onChange(value)}
                        placeholder="https://.../.well-known/jwks.json"
                      />
                    )}
                  />
                </FormGroup>
              </>
            )}

            {authType === "EXTERNAL_SECRET" && (
              <>
                {sharedSecretMasked && (
                  <FormGroup
                    label="Current shared secret (hashed)"
                    fieldId="currentSharedSecret"
                  >
                    <TextInput
                      id="currentSharedSecret"
                      value={sharedSecretMasked}
                      readOnlyVariant="default"
                      type="text"
                    />
                  </FormGroup>
                )}
                <FormGroup
                  label={
                    sharedSecretMasked ? "New shared secret" : "Shared secret"
                  }
                  fieldId="sharedSecret"
                >
                  <Controller
                    name="sharedSecret"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        id="sharedSecret"
                        type="password"
                        value={field.value}
                        onChange={(_e, value) => field.onChange(value)}
                        autoComplete="new-password"
                      />
                    )}
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        Cleartext value. It will be hashed (argon2id) before
                        being stored. Leave blank to keep the existing value.
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </>
            )}

            {authType === "EXTERNAL_BASIC" && (
              <>
                <FormGroup label="Username" fieldId="basicUsername">
                  <Controller
                    name="basicUsername"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        id="basicUsername"
                        value={field.value}
                        onChange={(_e, value) => field.onChange(value)}
                      />
                    )}
                  />
                </FormGroup>
                {basicPasswordMasked && (
                  <FormGroup
                    label="Current password (hashed)"
                    fieldId="currentBasicPassword"
                  >
                    <TextInput
                      id="currentBasicPassword"
                      value={basicPasswordMasked}
                      readOnlyVariant="default"
                      type="text"
                    />
                  </FormGroup>
                )}
                <FormGroup
                  label={basicPasswordMasked ? "New password" : "Password"}
                  fieldId="basicPassword"
                >
                  <Controller
                    name="basicPassword"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        id="basicPassword"
                        type="password"
                        value={field.value}
                        onChange={(_e, value) => field.onChange(value)}
                        autoComplete="new-password"
                      />
                    )}
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        Cleartext value. It will be hashed (argon2id) before
                        being stored. Leave blank to keep the existing value.
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </>
            )}

            <ActionGroup>
              <Button type="submit" isDisabled={!isDirty && !!existingConfig}>
                {existingConfig ? t("save") : "Create"}
              </Button>
              {existingConfig && (
                <Button variant="danger" onClick={onDelete} type="button">
                  Delete configuration
                </Button>
              )}
              <Button variant="link" type="button" onClick={() => load()}>
                {t("revert")}
              </Button>
            </ActionGroup>
          </Form>
        </FormProvider>
      </GridItem>
    </Grid>
  );
}
