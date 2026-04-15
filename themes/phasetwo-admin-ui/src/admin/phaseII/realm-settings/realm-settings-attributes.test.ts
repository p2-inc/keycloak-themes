import { describe, expect, it } from "vitest";

import {
  getProviderConfigFormAttributes,
  mergeProviderConfigAttributes,
} from "./realm-settings-attributes";

describe("realm settings attribute helpers", () => {
  it("keeps portal visibility keys when removing one portal asset key", () => {
    const currentAttributes = {
      cibaBackchannelTokenDeliveryMode: "poll",
      "_providerConfig.assets.portal.primaryColor100": "#9e4c4c",
      "_providerConfig.portal.org.enabled": "true",
      "_providerConfig.portal.org.members.enabled": "true",
      "_providerConfig.portal.profile.enabled": "true",
    };

    const submittedAttributes = [
      {
        key: "_providerConfig.portal.org.enabled",
        value: "true",
      },
      {
        key: "_providerConfig.portal.org.members.enabled",
        value: "true",
      },
      {
        key: "_providerConfig.portal.profile.enabled",
        value: "true",
      },
    ];

    expect(
      mergeProviderConfigAttributes(
        currentAttributes,
        submittedAttributes,
        Object.keys(currentAttributes).filter((key) =>
          key.startsWith("_providerConfig"),
        ),
      ),
    ).toEqual({
      cibaBackchannelTokenDeliveryMode: "poll",
      "_providerConfig.portal.org.enabled": "true",
      "_providerConfig.portal.org.members.enabled": "true",
      "_providerConfig.portal.profile.enabled": "true",
    });
  });

  it("keeps provider config keys that were never loaded into the editor", () => {
    const currentAttributes = {
      cibaBackchannelTokenDeliveryMode: "poll",
      "_providerConfig.assets.portal.primaryColor100": "#9e4c4c",
      "_providerConfig.portal.org.enabled": "true",
      "_providerConfig.portal.org.members.enabled": "true",
      "_providerConfig.portal.profile.enabled": "true",
    };

    expect(
      mergeProviderConfigAttributes(
        currentAttributes,
        [],
        ["_providerConfig.assets.portal.primaryColor100"],
      ),
    ).toEqual({
      cibaBackchannelTokenDeliveryMode: "poll",
      "_providerConfig.portal.org.enabled": "true",
      "_providerConfig.portal.org.members.enabled": "true",
      "_providerConfig.portal.profile.enabled": "true",
    });
  });

  it("filters to sorted provider config keys for the form", () => {
    expect(
      getProviderConfigFormAttributes({
        attributes: {
          zzz: "1",
          "_providerConfig.portal.profile.enabled": "true",
          "_providerConfig.assets.portal.primaryColor100": "#9e4c4c",
        },
      }),
    ).toEqual([
      {
        key: "_providerConfig.assets.portal.primaryColor100",
        value: "#9e4c4c",
      },
      {
        key: "_providerConfig.portal.profile.enabled",
        value: "true",
      },
    ]);
  });

  it("ignores blank rows from the form payload", () => {
    expect(
      mergeProviderConfigAttributes(
        {
          "_providerConfig.portal.profile.enabled": "true",
        },
        [
          {
            key: "_providerConfig.portal.profile.enabled",
            value: "true",
          },
          {
            key: "   ",
            value: "",
          },
        ],
        ["_providerConfig.portal.profile.enabled"],
      ),
    ).toEqual({
      "_providerConfig.portal.profile.enabled": "true",
    });
  });

  it("ignores non-provider-config keys in submitted rows", () => {
    expect(
      mergeProviderConfigAttributes(
        {
          "_providerConfig.portal.profile.enabled": "true",
          darkMode: "true",
        },
        [
          {
            key: "_providerConfig.portal.profile.enabled",
            value: "false",
          },
          {
            key: "darkMode",
            value: "false",
          },
        ],
        ["_providerConfig.portal.profile.enabled"],
      ),
    ).toEqual({
      "_providerConfig.portal.profile.enabled": "false",
      darkMode: "true",
    });
  });
});
