/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.20.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/i18n.ts" --revert
 */

import { i18nBuilder } from "@keycloakify/login-ui/i18n";
import type { ThemeName } from "../kc.gen";

/** @see: https://docs.keycloakify.dev/features/i18n */
const { I18nProvider, useI18n } = i18nBuilder
  .withThemeName<ThemeName>()
  .withCustomTranslations({
    en: {
      welcomeMessage: "Let's do this.",
      loginAccountTitle: "Login to your account",
      registerTitle: "Register a new account",
      email: "Email",
      enterCredentials: "Enter your credentials below to login",
      noAccount: "Don't have an account?",
      doRegister: "Sign up",
      "organization.selectTitle": "Choose Your Organization",
      "organization.pickPlaceholder": "Pick an organization to continue",
      "identity-provider-login-last-used": "Last used",
      attemptedUsernameLoggingInAs: "Logging in as",
      // Magic Link
      magicLinkConfirmation:
        "Check your email, and click on the link to log in!",
      doResend: "Resend",
      magicLinkContinuationConfirmation:
        "Check your email, and click on the link to log in! Please do not close this tab.",
      magicLinkSuccessfulLoginTitle: "Authentication session confirmed",
      magicLinkSuccessfulLoginBody: "Please return to login page tab.",
      magicLinkFailLoginTitle: "Authentication session expired",
      magicLinkFailLoginBody:
        "Please close this tab and restart the login flow.",
      loginPage: "Login page",
      otpFormTitle: "Enter access code",
      viewEmailTitle: "Check your email",
      // Org extensions
      invitationTitle: "Join an Organization",
      invitationBody:
        "You have been invited to join the following organization(s). Uncheck those you wish to decline.",
      selectOrgTitle: "Select an Organization.",
      selectOrgHeader: "Select an Organization.",
      selectOrganization: "Select an Organization",
      noOrganizationError:
        "You are not part of any organization, Contact an Administrator.",
      invalidOrganizationError: "Invalid Organization.",
      incompatibleFlow:
        "Authenticator needs an organization associated with the IDP.",
      emailDomainMissing: "Could not extract user email domain.",
      validDomainNotFound: "Valid identity email domain not found.",
      selectIdpTitle: "Find your SSO provider",
      selectIdpHeader: "Find your SSO provider",
      doSelectIdp: "SSO provider alias",
      "home-idp-discovery-identity-provider-login-label":
        "Find your SSO provider",
      validationSuccessTitle: "Successful Identity Provider Validation!",
      validationCloseWindow:
        "You may now close this window and return to the application.",
    },
  })
  .build();

export { I18nProvider, useI18n };
