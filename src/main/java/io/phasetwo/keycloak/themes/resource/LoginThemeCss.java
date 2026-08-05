package io.phasetwo.keycloak.themes.resource;

import com.google.common.base.Strings;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * Builds the shadcn CSS-variable block for a realm's login theme from the shared
 * {@code _providerConfig.assets.theme.v2.*} brand tokens.
 *
 * <p>This is the login surface's side of the cross-surface token contract — see
 * {@code docs/theme-editor/design-and-execution.md} §7.1 (the canonical output) and
 * the dashboard's {@code expandThemeTokens}. Each of the editable tokens is resolved
 * {@code v2 -> legacy -> default}, validated, foregrounds auto-contrast when unset,
 * and the result is expanded to the full shadcn variable set emitted as {@code :root}
 * (light) and {@code .dark} (dark).
 *
 * <p>The emitted block is appended to {@code /assets/css/login.css} after the legacy
 * {@code --p2-login-*} block, and loads after the theme's compiled stylesheet, so the
 * standard shadcn variables here win over the theme's built-in defaults. Realms that
 * set no {@code theme.v2.*} attribute fall back to legacy attributes and then these
 * defaults, so the output is unchanged for them.
 */
public final class LoginThemeCss {

  private LoginThemeCss() {}

  static final String V2_PREFIX = "_providerConfig.assets.theme.v2.";
  static final String LEGACY_PREFIX = "_providerConfig.assets.login.";

  /**
   * The base color tokens — the ones with a static default. Every other emitted
   * variable derives from one of these (see {@link #DERIVED_FROM} and §7.1).
   */
  static final List<String> BASE_TOKENS =
      List.of(
          "background",
          "foreground",
          "primary",
          "primaryForeground",
          "secondary",
          "secondaryForeground",
          "muted",
          "mutedForeground",
          "border");

  /**
   * Tokens with no static default: when the realm sets none, they fall back to the
   * resolved value of a base token, so a lone custom primary also moves the ring, a
   * lone custom background the card surface, etc. (§7.1 "…else X"). Editor-authored
   * themes set all of these explicitly, so this only affects partial/legacy realms.
   */
  static final Map<String, String> DERIVED_FROM =
      Map.of(
          "card", "background",
          "cardForeground", "foreground",
          "accent", "muted",
          "accentForeground", "foreground",
          "input", "border",
          "ring", "primary");

  /** Base-token light defaults — the login palette (mirror of DEFAULT_LIGHT_TOKENS, O-4). */
  static final Map<String, String> LIGHT_DEFAULTS =
      Map.ofEntries(
          Map.entry("background", "#ffffff"),
          Map.entry("foreground", "#0a0a0a"),
          Map.entry("primary", "#3b82f6"),
          Map.entry("primaryForeground", "#ffffff"),
          Map.entry("secondary", "#60a5fa"),
          Map.entry("secondaryForeground", "#0a0a0a"),
          Map.entry("muted", "#f4f4f5"),
          Map.entry("mutedForeground", "#71717a"),
          Map.entry("border", "#e4e4e7"));

  /** Base-token dark defaults (mirror of DEFAULT_DARK_TOKENS). */
  static final Map<String, String> DARK_DEFAULTS =
      Map.ofEntries(
          Map.entry("background", "#0a0a0a"),
          Map.entry("foreground", "#fafafa"),
          Map.entry("primary", "#3b82f6"),
          Map.entry("primaryForeground", "#ffffff"),
          Map.entry("secondary", "#1e3a5f"),
          Map.entry("secondaryForeground", "#fafafa"),
          Map.entry("muted", "#27272a"),
          Map.entry("mutedForeground", "#a1a1aa"),
          Map.entry("border", "#3f3f46"));

  /**
   * The only tokens with a legacy login fallback (the three structured colors the
   * server has always supported, plus the primary foreground). Value is the legacy
   * attribute's suffix under {@link #LEGACY_PREFIX}; dark reads the {@code -dark} form.
   */
  static final Map<String, String> LEGACY_SUFFIX =
      Map.of(
          "primary", "primaryColor",
          "secondary", "secondaryColor",
          "background", "backgroundColor",
          "primaryForeground", "primaryForegroundColor");

  // Value validation — these strings are interpolated verbatim into a <style>, so an
  // unchecked `red}` would terminate the rule early. Mirrors the portal resolver.
  private static final Pattern HEX =
      Pattern.compile("^#(?:[0-9a-f]{3}|[0-9a-f]{6})$", Pattern.CASE_INSENSITIVE);
  private static final Pattern KEYWORD = Pattern.compile("^[a-z]+$", Pattern.CASE_INSENSITIVE);
  private static final Pattern COLOR_FN =
      Pattern.compile(
          "^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\([0-9a-z%.,+\\-/ ]*\\)$",
          Pattern.CASE_INSENSITIVE);
  private static final Pattern LENGTH = Pattern.compile("^(?:0|[0-9]*\\.?[0-9]+(?:px|rem|em))$");

  static boolean isColor(String v) {
    if (v == null) return false;
    String t = v.trim();
    return HEX.matcher(t).matches()
        || KEYWORD.matcher(t).matches()
        || COLOR_FN.matcher(t).matches();
  }

  static boolean isLength(String v) {
    return v != null && LENGTH.matcher(v.trim()).matches();
  }

  /** First candidate that is non-empty and a valid color, or null. */
  private static String pickColor(String... candidates) {
    for (String c : candidates) {
      if (c != null) {
        String t = c.trim();
        if (!t.isEmpty() && isColor(t)) return t;
      }
    }
    return null;
  }

  /** Readable near-black/white foreground for a hex background; white for non-hex. */
  static String contrast(String background) {
    String t = background == null ? "" : background.trim();
    if (!HEX.matcher(t).matches()) return "#ffffff";
    String hex = t.substring(1);
    if (hex.length() == 3) {
      StringBuilder b = new StringBuilder();
      for (char c : hex.toCharArray()) b.append(c).append(c);
      hex = b.toString();
    }
    double r = channel(Integer.parseInt(hex.substring(0, 2), 16));
    double g = channel(Integer.parseInt(hex.substring(2, 4), 16));
    double b = channel(Integer.parseInt(hex.substring(4, 6), 16));
    double luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance >= 0.5 ? "#18181b" : "#ffffff";
  }

  private static double channel(int c) {
    double s = c / 255.0;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  /** Resolve every token for one mode: base tokens then derived. */
  static Map<String, String> resolve(Function<String, String> attr, boolean dark) {
    Map<String, String> defaults = dark ? DARK_DEFAULTS : LIGHT_DEFAULTS;
    Map<String, String> out = new LinkedHashMap<>();
    Map<String, String> explicit = new LinkedHashMap<>(); // v2/legacy only, pre-default

    // Base tokens: v2 -> legacy -> static default.
    for (String token : BASE_TOKENS) {
      String v2 = attr.apply(V2_PREFIX + (dark ? "dark" + capitalize(token) : token));
      String legacy = null;
      String suffix = LEGACY_SUFFIX.get(token);
      if (suffix != null) {
        legacy = attr.apply(LEGACY_PREFIX + suffix + (dark ? "-dark" : ""));
      }
      String set = pickColor(v2, legacy);
      explicit.put(token, set);
      out.put(token, set != null ? set : defaults.get(token));
    }

    // Auto-contrast the two foregrounds when their base was set but they were not:
    // a lone custom primary/secondary must not keep the default text color.
    autoContrast(out, explicit, "primaryForeground", "primary");
    autoContrast(out, explicit, "secondaryForeground", "secondary");

    // Derived tokens: v2 -> the resolved base token.
    for (Map.Entry<String, String> e : DERIVED_FROM.entrySet()) {
      String token = e.getKey();
      String v2 = attr.apply(V2_PREFIX + (dark ? "dark" + capitalize(token) : token));
      String set = pickColor(v2);
      out.put(token, set != null ? set : out.get(e.getValue()));
    }
    return out;
  }

  private static void autoContrast(
      Map<String, String> out, Map<String, String> explicit, String fg, String bg) {
    if (explicit.get(fg) == null && explicit.get(bg) != null) {
      out.put(fg, contrast(out.get(bg)));
    }
  }

  /** Render the full {@code :root} + {@code .dark} shadcn block for a realm. */
  public static String render(Function<String, String> attr) {
    Map<String, String> light = resolve(attr, false);
    Map<String, String> dark = resolve(attr, true);

    String radius = attr.apply(V2_PREFIX + "radius");
    String font = attr.apply(V2_PREFIX + "fontFamily");

    StringBuilder o = new StringBuilder();
    o.append("/* phase-two theme tokens */\n:root {\n");
    expand(o, light);
    if (isLength(radius)) o.append("  --radius: ").append(radius.trim()).append(";\n");
    if (!Strings.isNullOrEmpty(font)) o.append("  --font-sans: ").append(font.trim()).append(";\n");
    o.append("}\n.dark {\n");
    expand(o, dark);
    o.append("}\n");
    return o.toString();
  }

  /** Emit the shadcn variables for one resolved mode (§7.1). */
  private static void expand(StringBuilder o, Map<String, String> t) {
    v(o, "--background", t.get("background"));
    v(o, "--foreground", t.get("foreground"));
    v(o, "--card", t.get("card"));
    v(o, "--card-foreground", t.get("cardForeground"));
    v(o, "--popover", t.get("background"));
    v(o, "--popover-foreground", t.get("foreground"));
    v(o, "--primary", t.get("primary"));
    v(o, "--primary-foreground", t.get("primaryForeground"));
    v(o, "--secondary", t.get("secondary"));
    v(o, "--secondary-foreground", t.get("secondaryForeground"));
    v(o, "--muted", t.get("muted"));
    v(o, "--muted-foreground", t.get("mutedForeground"));
    v(o, "--accent", t.get("accent"));
    v(o, "--accent-foreground", t.get("accentForeground"));
    v(o, "--border", t.get("border"));
    v(o, "--input", t.get("input"));
    v(o, "--ring", t.get("ring"));
    // sidebar-* derive from muted/border/primary/foreground (no tokens of their own).
    v(o, "--sidebar", t.get("muted"));
    v(o, "--sidebar-foreground", t.get("foreground"));
    v(o, "--sidebar-primary", t.get("primary"));
    v(o, "--sidebar-primary-foreground", t.get("primaryForeground"));
    v(o, "--sidebar-accent", t.get("border"));
    v(o, "--sidebar-accent-foreground", t.get("foreground"));
    v(o, "--sidebar-border", t.get("border"));
    v(o, "--sidebar-ring", t.get("primary"));
  }

  private static void v(StringBuilder o, String name, String value) {
    o.append("  ").append(name).append(": ").append(value).append(";\n");
  }

  private static String capitalize(String s) {
    return Character.toUpperCase(s.charAt(0)) + s.substring(1);
  }
}
