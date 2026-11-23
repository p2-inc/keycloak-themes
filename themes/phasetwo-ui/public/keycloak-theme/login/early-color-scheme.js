/*
 * Early color scheme for the login theme.
 *
 * Keycloakify injects this file into the <head> of every generated login page, but only when it
 * lives at public/keycloak-theme/login/early-color-scheme.js. The shadcn starter ships its copy at
 * public/keycloak-theme/early-color-scheme.js, which is never injected, so this owned copy is the
 * one that runs. It executes before first paint, so dark-mode users don't see a white page while
 * the bundle loads. It is not loaded in Storybook or the Vite dev server.
 *
 * Precedence, matching src/login/shared/getColorScheme.ts:
 *   1. the realm has dark mode turned off (kcContext.darkMode === false) -> light
 *   2. the ?dark=true|false query parameter (apps pass it on the login redirect)
 *   3. the choice stored for this tab (sessionStorage "kc-color-scheme")
 *   4. the choice saved with the theme toggle (localStorage "isDarkMode")
 *   5. the system preference
 *
 * The fallback colors match --background in src/login/index.css (oklch(0.97 0 0) and oklch(0.145 0 0)).
 * Once that stylesheet loads, var(--background) takes over, including realm brand overrides.
 */
(function () {
    var LIGHT_BACKGROUND = "#f5f5f5";
    var DARK_BACKGROUND = "#0a0a0a";

    function read(storageName, key) {
        try {
            return window[storageName].getItem(key);
        } catch (error) {
            return null;
        }
    }

    var isDark = (function () {
        var kcContext = window.kcContext;

        if (kcContext && kcContext.darkMode === false) {
            return false;
        }

        var param = new URLSearchParams(window.location.search).get("dark");

        if (param === "true") return true;
        if (param === "false") return false;

        var session = read("sessionStorage", "kc-color-scheme");

        if (session === "true") return true;
        if (session === "false") return false;

        var saved = read("localStorage", "isDarkMode");

        if (saved === "dark") return true;
        if (saved === "light") return false;

        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    })();

    var root = document.documentElement;

    {
        var style = document.createElement("style");

        style.textContent =
            ":root { color-scheme: light; } :root.dark { color-scheme: dark; }";

        document.head.appendChild(style);
    }

    if (isDark) {
        root.classList.add("dark");
    }

    root.style.backgroundColor =
        "var(--background, " + (isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND) + ")";
})();
