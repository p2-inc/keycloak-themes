/**
 * WARNING: Before modifying this file, run the following command:
 * 
 * $ npx keycloakify own --path "login/shared/redirectUrlOrigin.ts"
 * 
 * This file is provided by @oussemasahbeni/keycloakify-login-shadcn version 250004.0.15.
 * It was copied into your repository by the postinstall script: `keycloakify sync-extensions`.
 */

/* eslint-disable */

const SESSION_STORAGE_KEY = "redirectUrlOrigin";

export const redirectUrlOrigin = ((): string => {
    from_url: {
        const url = new URL(window.location.href);

        const value = url.searchParams.get("redirect_url");

        if (value === null) {
            break from_url;
        }

        const redirectUrlOrigin = new URL(value).origin;

        sessionStorage.setItem(SESSION_STORAGE_KEY, redirectUrlOrigin);

        return redirectUrlOrigin;
    }

    from_session_storage: {
        const redirectUrlOrigin = sessionStorage.getItem(SESSION_STORAGE_KEY);

        if (redirectUrlOrigin === null) {
            break from_session_storage;
        }

        return redirectUrlOrigin;
    }

    return "#";
})();
