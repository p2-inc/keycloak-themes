/**
 * Cloudflare Turnstile widget for Keycloakify login pages.
 *
 * Self-contained on purpose (React only, no theme imports) so other shadcn-based themes can copy
 * it as is. It:
 *  - loads https://challenges.cloudflare.com/turnstile/v0/api.js once per page, reusing a tag
 *    that is already there (Keycloak may add the same URL to kcContext.scripts);
 *  - renders a `.cf-turnstile` element with the site key, action and language;
 *  - sets data-theme from the `dark` class on <html> (the shadcn convention) and re-renders the
 *    widget when that class changes, unless `theme` is passed;
 *  - writes the token into a hidden input named `cf-turnstile-response` (Turnstile's own
 *    injected input is turned off so the form posts exactly one value).
 *
 * Render it inside the <form> that posts to Keycloak.
 */

import { useEffect, useId, useRef, useState } from "react";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

// Turnstile accepts "auto" or a tag like "en", "pt-br", "zh-cn"; anything else breaks the render.
const TURNSTILE_LANGUAGE = /^[a-z]{2,3}(?:[-_][a-z]{2})?$/i;

type TurnstileTheme = "light" | "dark" | "auto";

type TurnstileRenderParams = {
    sitekey: string;
    action?: string;
    language?: string;
    theme?: TurnstileTheme;
    "response-field"?: boolean;
    callback?: (token: string) => void;
    "expired-callback"?: () => void;
    "error-callback"?: () => void;
};

type TurnstileApi = {
    render: (container: HTMLElement, params: TurnstileRenderParams) => string | undefined;
    remove: (widget: HTMLElement | string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

let scriptPromise: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
    if (window.turnstile !== undefined) {
        return Promise.resolve(window.turnstile);
    }
    if (scriptPromise !== undefined) {
        return scriptPromise;
    }
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            `script[src="${TURNSTILE_SCRIPT_SRC}"]`
        );
        const script = existing ?? document.createElement("script");
        script.addEventListener("load", () => {
            if (window.turnstile !== undefined) {
                resolve(window.turnstile);
            } else {
                reject(new Error("Turnstile script loaded without window.turnstile"));
            }
        });
        script.addEventListener("error", () => {
            scriptPromise = undefined;
            reject(new Error("Turnstile script failed to load"));
        });
        if (existing === null) {
            script.src = TURNSTILE_SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
    });
    return scriptPromise;
}

function readDocumentTheme(): "light" | "dark" {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function useDocumentTheme(): "light" | "dark" {
    const [theme, setTheme] = useState(readDocumentTheme);
    useEffect(() => {
        const observer = new MutationObserver(() => setTheme(readDocumentTheme()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"]
        });
        return () => observer.disconnect();
    }, []);
    return theme;
}

export type TurnstileWidgetProps = {
    /** Turnstile site key (`turnstileSiteKey` / `captchaSiteKey`). */
    siteKey: string;
    /** Turnstile action (`turnstileAction` / `captchaAction`). */
    action?: string;
    /** Widget language, e.g. `captchaLanguage`. Values Turnstile doesn't accept fall back to "auto". */
    language?: string;
    /** Overrides the theme detected from the `dark` class on <html>. */
    theme?: TurnstileTheme;
    /** Name of the hidden input the token is written to. Keycloak reads `cf-turnstile-response`. */
    responseFieldName?: string;
    /** Called with the token once the challenge is solved. */
    onVerify?: (token: string) => void;
    /** Called when the token expires or the widget errors; the hidden input is cleared first. */
    onReset?: () => void;
    className?: string;
};

export function TurnstileWidget(props: TurnstileWidgetProps) {
    const {
        siteKey,
        action,
        language,
        theme: themeOverride,
        responseFieldName = "cf-turnstile-response",
        onVerify,
        onReset,
        className
    } = props;

    const documentTheme = useDocumentTheme();
    const theme = themeOverride ?? documentTheme;
    const widgetLanguage =
        language !== undefined && TURNSTILE_LANGUAGE.test(language) ? language : "auto";

    const containerRef = useRef<HTMLDivElement>(null);
    const [token, setToken] = useState("");

    // Keep the latest callbacks without re-rendering the widget when a parent passes new closures.
    const onVerifyRef = useRef(onVerify);
    const onResetRef = useRef(onReset);
    useEffect(() => {
        onVerifyRef.current = onVerify;
        onResetRef.current = onReset;
    });

    // Global callback names for Turnstile's implicit render, which reads data-callback and friends.
    const callbackPrefix = `turnstile_${useId().replace(/[^a-zA-Z0-9_]/g, "")}`;

    useEffect(() => {
        const container = containerRef.current;
        if (container === null) {
            return;
        }

        let cancelled = false;

        const handleVerify = (value: string) => {
            if (cancelled) return;
            setToken(value);
            onVerifyRef.current?.(value);
        };
        const handleReset = () => {
            if (cancelled) return;
            setToken("");
            onResetRef.current?.();
        };

        const globals = window as unknown as Record<string, unknown>;
        globals[`${callbackPrefix}_verify`] = handleVerify;
        globals[`${callbackPrefix}_reset`] = handleReset;

        loadTurnstile()
            .then(turnstile => {
                // On first load api.js renders every .cf-turnstile element itself; render
                // explicitly only if that didn't happen (script already loaded, theme change).
                if (cancelled || container.childElementCount > 0) return;
                try {
                    turnstile.render(container, {
                        sitekey: siteKey,
                        action,
                        language: widgetLanguage,
                        theme,
                        "response-field": false,
                        callback: handleVerify,
                        "expired-callback": handleReset,
                        "error-callback": handleReset
                    });
                } catch (error) {
                    console.error("Turnstile render failed", error);
                }
            })
            .catch(error => console.error(error));

        return () => {
            cancelled = true;
            delete globals[`${callbackPrefix}_verify`];
            delete globals[`${callbackPrefix}_reset`];
            try {
                window.turnstile?.remove(container);
            } catch {
                // The widget was never rendered.
            }
            container.replaceChildren();
            // A re-render (new theme, site key, ...) needs a fresh token.
            setToken("");
        };
    }, [siteKey, action, widgetLanguage, theme, callbackPrefix]);

    return (
        <>
            <div
                ref={containerRef}
                className={["cf-turnstile", className].filter(Boolean).join(" ")}
                data-sitekey={siteKey}
                data-action={action}
                data-language={widgetLanguage}
                data-theme={theme}
                data-response-field="false"
                data-callback={`${callbackPrefix}_verify`}
                data-expired-callback={`${callbackPrefix}_reset`}
                data-error-callback={`${callbackPrefix}_reset`}
            />
            <input type="hidden" name={responseFieldName} value={token} />
        </>
    );
}
