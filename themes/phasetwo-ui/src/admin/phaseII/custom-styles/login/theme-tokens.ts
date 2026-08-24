/**
 * The login theme's brand tokens, as the server resolves them.
 *
 * Mirrors `LoginThemeCss` in the `keycloak-themes` extension jar. This theme ships in
 * the same artifact as that resolver, so the two are versioned together: an admin
 * running this panel is by definition running a resolver that understands
 * `theme.v2.*`. That is why the panel writes only the v2 attributes and needs no
 * compatibility fallback on the write side — unlike the control-plane editor, which
 * talks to clusters of arbitrary age.
 */

export const THEME_V2_PREFIX = "_providerConfig.assets.theme.v2.";
export const LEGACY_LOGIN_PREFIX = "_providerConfig.assets.login.";

/**
 * The tokens carrying a static default — the ones worth editing. Every other shadcn
 * variable the server emits derives from one of these when unset (`card` from
 * `background`, `accent` from `muted`, `ring` from `primary`, `input` from `border`,
 * and the sidebar/popover families), so exposing them here would add fields that only
 * repeat a value the server already infers.
 */
export const BASE_TOKENS = [
  "background",
  "foreground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "border",
] as const;

export type BaseToken = (typeof BASE_TOKENS)[number];

/** The only tokens with a legacy fallback, matching `LoginThemeCss.LEGACY_SUFFIX`. */
const LEGACY_SUFFIX: Partial<Record<BaseToken, string>> = {
  primary: "primaryColor",
  secondary: "secondaryColor",
  background: "backgroundColor",
  primaryForeground: "primaryForegroundColor",
};

/** `primaryForeground` -> `darkPrimaryForeground`. */
export const darkTokenName = (token: BaseToken): string =>
  `dark${token.charAt(0).toUpperCase()}${token.slice(1)}`;

export const v2AttrKey = (token: BaseToken, dark: boolean): string =>
  `${THEME_V2_PREFIX}${dark ? darkTokenName(token) : token}`;

export const RADIUS_ATTR_KEY = `${THEME_V2_PREFIX}radius`;
export const FONT_FAMILY_ATTR_KEY = `${THEME_V2_PREFIX}fontFamily`;

const legacyAttrKey = (token: BaseToken, dark: boolean): string | undefined => {
  const suffix = LEGACY_SUFFIX[token];
  return suffix === undefined
    ? undefined
    : `${LEGACY_LOGIN_PREFIX}${suffix}${dark ? "-dark" : ""}`;
};

// The same shapes the server accepts. It treats anything else as unset, so surfacing
// an invalid value here would misrepresent what the login page actually renders.
const CSS_COLOR =
  /^(?:#(?:[0-9a-f]{3}|[0-9a-f]{6})|[a-z]+|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([0-9a-z%.,+\-/ ]*\))$/i;
const CSS_LENGTH = /^(?:0|[0-9]*\.?[0-9]+(?:px|rem|em))$/;

export const isValidColor = (value: string): boolean =>
  CSS_COLOR.test(value.trim());

export const isValidLength = (value: string): boolean =>
  CSS_LENGTH.test(value.trim());

/**
 * What the login page renders for one token: the shared v2 attribute, else the legacy
 * one, else empty — meaning the server's built-in default applies.
 *
 * Reading the legacy value here is what makes the panel show the truth on a realm that
 * was only ever themed through the legacy fields. Saving then promotes it to `v2`,
 * which is the migration-on-touch the resolver's precedence already implies.
 */
export const readToken = (
  attributes: Record<string, string> | undefined,
  token: BaseToken,
  dark: boolean,
): string => {
  const v2 = attributes?.[v2AttrKey(token, dark)]?.trim();
  if (v2 && isValidColor(v2)) return v2;

  const legacyKey = legacyAttrKey(token, dark);
  const legacy = legacyKey ? attributes?.[legacyKey]?.trim() : undefined;
  return legacy && isValidColor(legacy) ? legacy : "";
};
