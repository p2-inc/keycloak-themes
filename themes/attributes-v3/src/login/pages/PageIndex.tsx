import { Suspense, lazy } from "react";
import { useKcContext } from "../KcContext";

// Default Keycloak pages
const Page_login = lazy(() => import("./default/login"));
const Page_register = lazy(() => import("./default/register"));
const Page_info = lazy(() => import("./default/info"));
const Page_error = lazy(() => import("./default/error"));
const Page_login_reset_password = lazy(() => import("./default/login-reset-password"));
const Page_login_verify_email = lazy(() => import("./default/login-verify-email"));
const Page_terms = lazy(() => import("./default/terms"));
const Page_login_oauth2_device_verify_user_code = lazy(() => import("./default/login-oauth2-device-verify-user-code"));
const Page_login_oauth_grant = lazy(() => import("./default/login-oauth-grant"));
const Page_login_otp = lazy(() => import("./default/login-otp"));
const Page_login_password = lazy(() => import("./default/login-password"));
const Page_login_username = lazy(() => import("./default/login-username"));
const Page_webauthn_authenticate = lazy(() => import("./default/webauthn-authenticate"));
const Page_webauthn_register = lazy(() => import("./default/webauthn-register"));
const Page_login_update_password = lazy(() => import("./default/login-update-password"));
const Page_link_idp_action = lazy(() => import("./default/link-idp-action"));
const Page_login_update_profile = lazy(() => import("./default/login-update-profile"));
const Page_login_idp_link_confirm = lazy(() => import("./default/login-idp-link-confirm"));
const Page_login_page_expired = lazy(() => import("./default/login-page-expired"));
const Page_login_idp_link_email = lazy(() => import("./default/login-idp-link-email"));
const Page_login_config_totp = lazy(() => import("./default/login-config-totp"));
const Page_logout_confirm = lazy(() => import("./default/logout-confirm"));
const Page_idp_review_user_profile = lazy(() => import("./default/idp-review-user-profile"));
const Page_update_email = lazy(() => import("./default/update-email"));
const Page_select_authenticator = lazy(() => import("./default/select-authenticator"));
const Page_saml_post_form = lazy(() => import("./default/saml-post-form"));
const Page_delete_credential = lazy(() => import("./default/delete-credential"));
const Page_code = lazy(() => import("./default/code"));
const Page_delete_account_confirm = lazy(() => import("./default/delete-account-confirm"));
const Page_frontchannel_logout = lazy(() => import("./default/frontchannel-logout"));
const Page_login_recovery_authn_code_config = lazy(() => import("./default/login-recovery-authn-code-config"));
const Page_login_recovery_authn_code_input = lazy(() => import("./default/login-recovery-authn-code-input"));
const Page_login_reset_otp = lazy(() => import("./default/login-reset-otp"));
const Page_login_x509_info = lazy(() => import("./default/login-x509-info"));
const Page_webauthn_error = lazy(() => import("./default/webauthn-error"));
const Page_login_passkeys_conditional_authenticate = lazy(() => import("./default/login-passkeys-conditional-authenticate"));
const Page_login_idp_link_confirm_override = lazy(() => import("./default/login-idp-link-confirm-override"));
const Page_select_organization = lazy(() => import("./default/select-organization"));

// Extension pages
const Page_invitations = lazy(() => import("./extensions/orgs/invitations"));
const Page_ext_select_organization = lazy(
    () => import("./extensions/orgs/ext-select-organization"),
);
const Page_login_select_idp = lazy(
    () => import("./extensions/orgs/login-select-idp"),
);
const Page_hidpd_select_idp = lazy(
    () => import("./extensions/orgs/hidpd-select-idp"),
);
const Page_idp_validation = lazy(
    () => import("./extensions/orgs/idp-validation"),
);
const Page_login_recaptcha = lazy(() => import("./extensions/login-recaptcha"));
const Page_otp_form = lazy(() => import("./extensions/magic-link/otp-form"));
const Page_email_confirmation = lazy(() => import("./extensions/magic-link/email-confirmation"));
const Page_email_confirmation_error = lazy(
    () => import("./extensions/magic-link/email-confirmation-error"),
);
const Page_view_email = lazy(() => import("./extensions/magic-link/view-email"));
const Page_view_email_continuation = lazy(
    () => import("./extensions/magic-link/view-email-continuation"),
);

export function PageIndex() {
    const { kcContext } = useKcContext();

    return (
        <Suspense>
            {(() => {
                switch (kcContext.pageId) {
                    // Default pages
                    case "login.ftl":
                        return <Page_login />;
                    case "register.ftl":
                        return <Page_register />;
                    case "info.ftl":
                        return <Page_info />;
                    case "error.ftl":
                        return <Page_error />;
                    case "login-reset-password.ftl":
                        return <Page_login_reset_password />;
                    case "login-verify-email.ftl":
                        return <Page_login_verify_email />;
                    case "terms.ftl":
                        return <Page_terms />;
                    case "login-oauth2-device-verify-user-code.ftl":
                        return <Page_login_oauth2_device_verify_user_code />;
                    case "login-oauth-grant.ftl":
                        return <Page_login_oauth_grant />;
                    case "login-otp.ftl":
                        return <Page_login_otp />;
                    case "login-username.ftl":
                        return <Page_login_username />;
                    case "login-password.ftl":
                        return <Page_login_password />;
                    case "webauthn-authenticate.ftl":
                        return <Page_webauthn_authenticate />;
                    case "webauthn-register.ftl":
                        return <Page_webauthn_register />;
                    case "login-update-password.ftl":
                        return <Page_login_update_password />;
                    case "link-idp-action.ftl":
                        return <Page_link_idp_action />;
                    case "login-update-profile.ftl":
                        return <Page_login_update_profile />;
                    case "login-idp-link-confirm.ftl":
                        return <Page_login_idp_link_confirm />;
                    case "login-idp-link-email.ftl":
                        return <Page_login_idp_link_email />;
                    case "login-page-expired.ftl":
                        return <Page_login_page_expired />;
                    case "login-config-totp.ftl":
                        return <Page_login_config_totp />;
                    case "logout-confirm.ftl":
                        return <Page_logout_confirm />;
                    case "idp-review-user-profile.ftl":
                        return <Page_idp_review_user_profile />;
                    case "update-email.ftl":
                        return <Page_update_email />;
                    case "select-authenticator.ftl":
                        return <Page_select_authenticator />;
                    case "saml-post-form.ftl":
                        return <Page_saml_post_form />;
                    case "delete-credential.ftl":
                        return <Page_delete_credential />;
                    case "code.ftl":
                        return <Page_code />;
                    case "delete-account-confirm.ftl":
                        return <Page_delete_account_confirm />;
                    case "frontchannel-logout.ftl":
                        return <Page_frontchannel_logout />;
                    case "login-recovery-authn-code-config.ftl":
                        return <Page_login_recovery_authn_code_config />;
                    case "login-recovery-authn-code-input.ftl":
                        return <Page_login_recovery_authn_code_input />;
                    case "login-reset-otp.ftl":
                        return <Page_login_reset_otp />;
                    case "login-x509-info.ftl":
                        return <Page_login_x509_info />;
                    case "webauthn-error.ftl":
                        return <Page_webauthn_error />;
                    case "login-passkeys-conditional-authenticate.ftl":
                        return <Page_login_passkeys_conditional_authenticate />;
                    case "login-idp-link-confirm-override.ftl":
                        return <Page_login_idp_link_confirm_override />;
                    case "select-organization.ftl":
                        return <Page_select_organization />;
                    // Extension pages
                    case "otp-form.ftl":
                        return <Page_otp_form />;
                    case "email-confirmation.ftl":
                        return <Page_email_confirmation />;
                    case "email-confirmation-error.ftl":
                        return <Page_email_confirmation_error />;
                    case "view-email.ftl":
                        return <Page_view_email />;
                    case "view-email-continuation.ftl":
                        return <Page_view_email_continuation />;
                    // Extension pages
                    case "invitations.ftl":
                        return <Page_invitations />;
                    case "ext-select-organization.ftl":
                        return <Page_ext_select_organization />;
                    case "login-select-idp.ftl":
                        return <Page_login_select_idp />;
                    case "hidpd-select-idp.ftl":
                        return <Page_hidpd_select_idp />;
                    case "idp-validation.ftl":
                        return <Page_idp_validation />;
                    case "login-recaptcha.ftl":
                        return <Page_login_recaptcha />;
                }
            })()}
        </Suspense>
    );
}
