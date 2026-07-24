/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { keycloakify } from "keycloakify/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    keycloakify({
      accountThemeImplementation: "Single-Page",
      themeName: ["phasetwo-ui"],
      themeVersion: "0.0.1",
      environmentVariables: [
        { name: "SHOW_DARK_MODE_TOGGLE", default: "false" },
      ],
      // Custom translation keys (defined in src/login/i18n.ts via
      // withCustomTranslations) are used only inside the React bundle, so
      // Keycloakify's FreeMarker scanner can't auto-discover them and realm-
      // level localization overrides never reach x-keycloakify.messages.
      // Listing a key here forces the server to resolve msg(key) and forward
      // the result to the client, where it outranks the theme default. Safe
      // for all keys: Keycloakify writes the withCustomTranslations values into
      // the theme's messages_*.properties, so with no realm override msg()
      // resolves to the custom default (no regression); with an override it
      // resolves to the override. Keep this list in sync with i18n.ts.
      // https://docs.keycloakify.dev/features/i18n/adding-new-translation-messages-or-changing-the-default-ones#my-realm-overrides-translation-arent-applied
      kcContextExclusionsFtl: `
        <@addToXKeycloakifyMessagesIfMessageKey str="welcomeMessage" />
        <@addToXKeycloakifyMessagesIfMessageKey str="loginAccountTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="registerTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="email" />
        <@addToXKeycloakifyMessagesIfMessageKey str="enterCredentials" />
        <@addToXKeycloakifyMessagesIfMessageKey str="noAccount" />
        <@addToXKeycloakifyMessagesIfMessageKey str="doRegister" />
        <@addToXKeycloakifyMessagesIfMessageKey str="organization.selectTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="organization.pickPlaceholder" />
        <@addToXKeycloakifyMessagesIfMessageKey str="identity-provider-login-last-used" />
        <@addToXKeycloakifyMessagesIfMessageKey str="attemptedUsernameLoggingInAs" />
        <@addToXKeycloakifyMessagesIfMessageKey str="magicLinkConfirmation" />
        <@addToXKeycloakifyMessagesIfMessageKey str="doResend" />
        <@addToXKeycloakifyMessagesIfMessageKey str="magicLinkContinuationConfirmation" />
        <@addToXKeycloakifyMessagesIfMessageKey str="magicLinkSuccessfulLoginTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="magicLinkSuccessfulLoginBody" />
        <@addToXKeycloakifyMessagesIfMessageKey str="magicLinkFailLoginTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="magicLinkFailLoginBody" />
        <@addToXKeycloakifyMessagesIfMessageKey str="loginPage" />
        <@addToXKeycloakifyMessagesIfMessageKey str="otpFormTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="viewEmailTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="invitationTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="invitationBody" />
        <@addToXKeycloakifyMessagesIfMessageKey str="selectOrgTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="selectOrgHeader" />
        <@addToXKeycloakifyMessagesIfMessageKey str="selectOrganization" />
        <@addToXKeycloakifyMessagesIfMessageKey str="noOrganizationError" />
        <@addToXKeycloakifyMessagesIfMessageKey str="invalidOrganizationError" />
        <@addToXKeycloakifyMessagesIfMessageKey str="incompatibleFlow" />
        <@addToXKeycloakifyMessagesIfMessageKey str="emailDomainMissing" />
        <@addToXKeycloakifyMessagesIfMessageKey str="validDomainNotFound" />
        <@addToXKeycloakifyMessagesIfMessageKey str="selectIdpTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="selectIdpHeader" />
        <@addToXKeycloakifyMessagesIfMessageKey str="doSelectIdp" />
        <@addToXKeycloakifyMessagesIfMessageKey str="home-idp-discovery-identity-provider-login-label" />
        <@addToXKeycloakifyMessagesIfMessageKey str="validationSuccessTitle" />
        <@addToXKeycloakifyMessagesIfMessageKey str="validationCloseWindow" />
      `,
      keycloakifyBuildDirPath: path.resolve(
        dirname,
        "../../target/phasetwo-ui",
      ),
      keycloakVersionTargets: {
        "22-to-25": false,
        "all-other-versions": "phasetwo-ui-theme.jar",
      },
      startKeycloakOptions: {
        dockerImage: "quay.io/phasetwo/phasetwo-keycloak:latest",
        keycloakExtraArgs: [
          "--spi-email-template-provider=freemarker-plus-mustache",
          "--spi-email-template-freemarker-plus-mustache-enabled=true",
          "--spi-theme-cache-themes=false",
        ],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
