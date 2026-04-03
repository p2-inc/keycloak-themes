import { i18nBuilder } from "@keycloakify/login-ui/i18n";
import type { ThemeName } from "../kc.gen";

/** @see: https://docs.keycloakify.dev/features/i18n */
const { I18nProvider, useI18n } = i18nBuilder
    .withThemeName<ThemeName>()
    .withCustomTranslations({
        en: {
            welcomeMessage:
                "Welcome - Your gateway to seamless authentication.",
            loginAccountTitle: "Login to your account",
            registerTitle: "Register a new account",
            email: "Email",
            enterCredentials: "Enter your credentials below to login",
            noAccount: "Don't have an account?",
            doRegister: "Sign up",
            "organization.selectTitle": "Choose Your Organization",
            "organization.pickPlaceholder":
                "Pick an organization to continue",
            // Magic Link
            magicLinkConfirmation:
                "Check your email, and click on the link to log in!",
            doResend: "Resend",
            magicLinkContinuationConfirmation:
                "Check your email, and click on the link to log in! Please do not close this tab.",
            magicLinkSuccessfulLoginTitle:
                "Authentication session confirmed",
            magicLinkSuccessfulLoginBody:
                "Please return to login page tab.",
            magicLinkFailLoginTitle: "Authentication session expired",
            magicLinkFailLoginBody:
                "Please close this tab and restart the login flow.",
            loginPage: "Login page",
            otpFormTitle: "Enter access code",
            viewEmailTitle: "Check your email",
            // Extensions
            invitationTitle: "Join an Organization",
            invitationBody:
                "You have been invited to join the following organization(s). Uncheck those you wish to decline.",
            doAccept: "Accept",
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
            validationSuccessTitle:
                "Successful Identity Provider Validation!",
            validationCloseWindow:
                "You may now close this window and return to the application.",
        },
        fr: {
            welcomeMessage:
                "Bienvenue - Votre passerelle vers une authentification sans faille.",
            loginAccountTitle: "Connectez-vous à votre compte",
            registerTitle: "Créer un nouveau compte",
            email: "E-mail",
            enterCredentials:
                "Entrez vos informations d'identification ci-dessous pour vous connecter",
            doRegister: "S'inscrire",
            noAccount: "Vous n'avez pas de compte?",
            "organization.selectTitle": "Choisissez Votre Organisation",
            "organization.pickPlaceholder":
                "Sélectionnez une organisation pour continuer",
            // Magic Link
            magicLinkConfirmation:
                "Vérifiez votre e-mail et cliquez sur le lien pour vous connecter !",
            doResend: "Renvoyer",
            magicLinkContinuationConfirmation:
                "Vérifiez votre e-mail et cliquez sur le lien pour vous connecter ! Ne fermez pas cet onglet.",
            magicLinkSuccessfulLoginTitle:
                "Session d'authentification confirmée",
            magicLinkSuccessfulLoginBody:
                "Veuillez revenir à l'onglet de la page de connexion.",
            magicLinkFailLoginTitle:
                "Session d'authentification expirée",
            magicLinkFailLoginBody:
                "Veuillez fermer cet onglet et recommencer la procédure de connexion.",
            loginPage: "Page de connexion",
            otpFormTitle: "Entrez le code d'accès",
            viewEmailTitle: "Vérifiez votre e-mail",
            // Extensions
            invitationTitle: "Rejoindre une organisation",
            invitationBody:
                "Vous avez été invité à rejoindre l'organisation suivante. Décochez celles que vous souhaitez refuser.",
            doAccept: "Accepter",
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
            validationSuccessTitle:
                "Successful Identity Provider Validation!",
            validationCloseWindow:
                "You may now close this window and return to the application.",
        },
    })
    .build();

export { I18nProvider, useI18n };
