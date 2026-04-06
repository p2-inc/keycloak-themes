import { createGetKcContextMock } from "@keycloakify/login-ui/KcContext/getKcContextMock";
import { kcEnvDefaults, themeNames } from "../../kc.gen";
import type { KcContextExtension, KcContextExtensionPerPage } from "../KcContext";

const kcContextExtension: KcContextExtension = {
    themeName: themeNames[0],
    client: {
        baseUrl: "https://my-theme.keycloakify.dev"
    },
    darkMode: true,
    properties: {
        ...kcEnvDefaults
    }
};
const kcContextExtensionPerPage: KcContextExtensionPerPage = {
    "otp-form.ftl": {
        auth: {
            attemptedUsername: "user@example.com",
        },
        url: {
            loginRestartFlowUrl: "/restart",
            loginAction: "/login-action",
        },
    },
    "email-confirmation.ftl": {
        magicLinkContinuation: {
            sameBrowser: true,
            url: "/login",
        },
    },
    "email-confirmation-error.ftl": {},
    "view-email.ftl": {
        auth: {
            attemptedUsername: "user@example.com",
        },
    },
    "view-email-continuation.ftl": {
        auth: {
            attemptedUsername: "user@example.com",
        },
    },
    "invitations.ftl": {
        invitations: {
            orgs: [
                { id: "org1", displayName: "Organization 1" },
                { id: "org2", displayName: "Organization 2" },
            ],
        },
    },
    "ext-select-organization.ftl": {
        organizations: [
            { id: "org1", name: "Organization 1" },
            { id: "org2", name: "Organization 2" },
        ],
    },
    "login-select-idp.ftl": {},
    "hidpd-select-idp.ftl": {
        hidpd: {
            providers: [
                {
                    alias: "google",
                    displayName: "Google",
                    loginUrl: "/realms/test/broker/google/login",
                },
                {
                    alias: "github",
                    displayName: "GitHub",
                    loginUrl: "/realms/test/broker/github/login",
                },
            ],
        },
    },
    "idp-validation.ftl": {
        message: {
            type: "success",
            summary: "Identity provider validation succeeded.",
        },
    },
    "login-recaptcha.ftl": {
        auth: {
            attemptedUsername: "user@example.com",
            selectedCredential: "someCredential",
        },
        registrationDisabled: false,
        recaptchaSiteKey: "6LfQHvApAAAAAE73SYTd5vS0lB1Xr7zdiQ-6iBVa",
        realm: {
            password: true,
            resetPasswordAllowed: true,
            registrationAllowed: true,
        },
    },
};

export const { getKcContextMock } = createGetKcContextMock({
    kcContextExtension,
    kcContextExtensionPerPage,
    overrides: {},
    overridesPerPage: {}
});
