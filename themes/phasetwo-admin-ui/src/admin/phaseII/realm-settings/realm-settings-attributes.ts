import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";

import type { KeyValueType } from "../orgs/components/key-value-form-custom/key-value-convert";

const PROVIDER_CONFIG_PREFIX = "_providerConfig";

export const isProviderConfigKey = (key: string) =>
  key.startsWith(PROVIDER_CONFIG_PREFIX);

export const getProviderConfigFormAttributes = (
  realmData: RealmRepresentation,
): KeyValueType[] =>
  Object.entries(realmData.attributes || {})
    .filter(([key]) => isProviderConfigKey(key))
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, undefined, { sensitivity: "base" }))
    .map(([key, value]) => ({
      key,
      value: value == null ? "" : String(value),
    }));

export const mergeProviderConfigAttributes = (
  currentAttributes: Record<string, any> | undefined,
  submittedAttributes: KeyValueType[] | undefined,
  removableProviderConfigKeys?: string[],
) => {
  const nextProviderConfig = Object.fromEntries(
    (submittedAttributes || [])
      .flatMap((attribute) => {
        if (!attribute || typeof attribute.key !== "string") {
          return [];
        }

        return [
          {
            key: attribute.key.trim(),
            value: attribute.value == null ? "" : String(attribute.value),
          },
        ];
      })
      .filter(({ key }) => key.length > 0)
      .map(({ key, value }) => [key, value]),
  );

  const mergedAttributes = { ...(currentAttributes || {}) };

  (removableProviderConfigKeys || Object.keys(currentAttributes || {})).forEach(
    (key) => {
      if (
        isProviderConfigKey(key) &&
        !(key in nextProviderConfig)
      ) {
        delete mergedAttributes[key];
      }
    },
  );

  Object.entries(nextProviderConfig).forEach(([key, value]) => {
    if (isProviderConfigKey(key)) {
      mergedAttributes[key] = value;
    }
  });

  return mergedAttributes;
};
