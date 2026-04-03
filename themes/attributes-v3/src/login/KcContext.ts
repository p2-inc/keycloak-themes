import {
    type ExtendKcContext,
    createUseKcContext,
} from "@keycloakify/login-ui/KcContext";
import type { KcEnvName, ThemeName } from "../kc.gen";

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {};
    client: {
        baseUrl?: string;
    };
    darkMode?: boolean;
};

export type KcContextExtensionPerPage = {
    "otp-form.ftl": {
        auth: {
            attemptedUsername: string;
        };
        url: {
            loginRestartFlowUrl: string;
            loginAction: string;
        };
    };
    "email-confirmation.ftl": {
        magicLinkContinuation: {
            sameBrowser: boolean;
            url: string;
        };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    "email-confirmation-error.ftl": {};
    "view-email.ftl": {
        auth: {
            attemptedUsername: string;
        };
    };
    "view-email-continuation.ftl": {
        auth: {
            attemptedUsername: string;
        };
    };
    "invitations.ftl": {
        invitations: {
            orgs: {
                id: string;
                displayName: string;
            }[];
        };
    };
    "ext-select-organization.ftl": {
        organizations: {
            id: string;
            name: string;
        }[];
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    "login-select-idp.ftl": {};
    "hidpd-select-idp.ftl": {
        hidpd: {
            providers: {
                loginUrl: string;
                alias: string;
                displayName: string;
                iconClasses?: string;
            }[];
        };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    "idp-validation.ftl": {};
    "login-recaptcha.ftl": {
        auth: {
            attemptedUsername: string;
            selectedCredential: string;
        };
        registrationDisabled: boolean;
        recaptchaSiteKey: string;
        realm: {
            password: boolean;
            resetPasswordAllowed: boolean;
            registrationAllowed: boolean;
        };
    };
};

export type KcContext = ExtendKcContext<
    KcContextExtension,
    KcContextExtensionPerPage
>;

export const { useKcContext, KcContextProvider } =
    createUseKcContext<KcContext>();
