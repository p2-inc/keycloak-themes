import { useEffect, useMemo } from "react";

/**
 * Derives the realm base path from either resourcesPath or loginAction.
 * We prefer resourcesPath because it is available on more pages.
 */
function getRealmBasePath(
    realmName: string,
    url: {
        resourcesPath?: string;
        loginAction?: string;
    },
): string {
    if (url.resourcesPath) {
        const resourcesSegment = "/resources";
        const idx = url.resourcesPath.indexOf(resourcesSegment);
        if (idx >= 0) {
            return `${url.resourcesPath.substring(0, idx)}/realms/${realmName}`;
        }
    }

    if (url.loginAction) {
        const realmSegment = `/realms/${realmName}`;
        const idx = url.loginAction.indexOf(realmSegment);
        if (idx >= 0) {
            return url.loginAction.substring(0, idx + realmSegment.length);
        }
    }

    return `/realms/${realmName}`;
}

/**
 * Injects a <link> tag to load dynamic realm CSS from the Phase Two assets endpoint.
 * The CSS overrides theme variables (--p2-login-primary-color, --p2-login-secondary-color,
 * --p2-login-background-color)
 * which are bridged to shadcn's semantic tokens in index.css.
 */
export function useDynamicCss(kcContext: {
    realm: { name: string };
    url: {
        resourcesPath?: string;
        loginAction?: string;
    };
}) {
    const { url } = kcContext;
    const basePath = useMemo(
        () => getRealmBasePath(kcContext.realm.name, url),
        [kcContext.realm.name, url],
    );

    useEffect(() => {
        const linkId = "dynamic-realm-css";

        // Avoid duplicate injection
        if (document.getElementById(linkId)) return;

        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = `${basePath}/assets/css/login.css`;
        document.head.appendChild(link);

        return () => {
            const existing = document.getElementById(linkId);
            if (existing) existing.remove();
        };
    }, [basePath]);
}

function setLinkHref(rel: string, href: string) {
    const existing = document.querySelector(
        `link[rel="${rel}"]`,
    ) as HTMLLinkElement | null;
    if (existing) {
        existing.href = href;
    } else {
        const link = document.createElement("link");
        link.rel = rel;
        link.href = href;
        document.head.appendChild(link);
    }
}

/**
 * Sets the favicon and apple-touch-icon to the provided defaults, then checks
 * if the realm has custom assets at the Phase Two assets endpoint and switches
 * to those if available.
 */
export function useDynamicFavicon(
    kcContext: {
        realm: { name: string };
        url: {
            resourcesPath?: string;
            loginAction?: string;
        };
    },
    defaultFaviconUrl: string,
    defaultAppiconUrl: string,
) {
    const { url } = kcContext;
    const basePath = useMemo(
        () => getRealmBasePath(kcContext.realm.name, url),
        [kcContext.realm.name, url],
    );

    useEffect(() => {
        setLinkHref("icon", defaultFaviconUrl);
        setLinkHref("apple-touch-icon", defaultAppiconUrl);

        const realmFaviconUrl = `${basePath}/assets/img/favicon`;
        fetch(realmFaviconUrl, { method: "HEAD" })
            .then((res) => {
                if (res.ok) setLinkHref("icon", realmFaviconUrl);
            })
            .catch(() => { /* keep default */ });

        const realmAppiconUrl = `${basePath}/assets/img/appicon`;
        fetch(realmAppiconUrl, { method: "HEAD" })
            .then((res) => {
                if (res.ok) setLinkHref("apple-touch-icon", realmAppiconUrl);
            })
            .catch(() => { /* keep default */ });
    }, [basePath, defaultFaviconUrl, defaultAppiconUrl]);
}

/**
 * Returns the base URL for realm assets.
 */
export function useRealmAssetsBase(kcContext: {
    realm: { name: string };
    url: {
        resourcesPath?: string;
        loginAction?: string;
    };
}): string {
    const { url } = kcContext;
    return useMemo(
        () => getRealmBasePath(kcContext.realm.name, url),
        [kcContext.realm.name, url],
    );
}
