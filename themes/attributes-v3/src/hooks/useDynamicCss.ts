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
    const basePath = useMemo(
        () => getRealmBasePath(kcContext.realm.name, kcContext.url),
        [
            kcContext.realm.name,
            kcContext.url.resourcesPath,
            kcContext.url.loginAction,
        ],
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

/**
 * Dynamically sets the favicon to the realm's custom favicon from the assets endpoint.
 */
export function useDynamicFavicon(kcContext: {
    realm: { name: string };
    url: {
        resourcesPath?: string;
        loginAction?: string;
    };
}) {
    const basePath = useMemo(
        () => getRealmBasePath(kcContext.realm.name, kcContext.url),
        [
            kcContext.realm.name,
            kcContext.url.resourcesPath,
            kcContext.url.loginAction,
        ],
    );

    useEffect(() => {
        const faviconUrl = `${basePath}/assets/img/favicon`;

        const existingFavicon = document.querySelector(
            'link[rel="icon"]',
        ) as HTMLLinkElement | null;
        if (existingFavicon) {
            existingFavicon.href = faviconUrl;
        } else {
            const link = document.createElement("link");
            link.rel = "icon";
            link.href = faviconUrl;
            document.head.appendChild(link);
        }
    }, [basePath]);
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
    return useMemo(
        () => getRealmBasePath(kcContext.realm.name, kcContext.url),
        [
            kcContext.realm.name,
            kcContext.url.resourcesPath,
            kcContext.url.loginAction,
        ],
    );
}
