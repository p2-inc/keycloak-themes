package io.phasetwo.keycloak.themes.resource;

import com.google.common.base.Strings;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * Builds the shadcn CSS-variable block for a realm's login theme from its
 * {@code _providerConfig.assets.theme.v2.*} brand-token attributes.
 *
 * <p>Each editable token is resolved {@code v2 -> legacy -> default}, validated, and
 * (for the primary/secondary foregrounds) auto-contrasted when unset. The resolved
 * values are expanded into the full set of shadcn CSS variables, emitted as
 * {@code :root} (light) and {@code .dark} (dark).
 *
 * <p>The block is appended to {@code /assets/css/login.css} after the legacy
 * {@code --p2-login-*} variables and loads after the theme's compiled stylesheet, so
 * these variables take precedence over the theme's built-in defaults. A realm that
 * sets no {@code theme.v2.*} attribute falls back to legacy attributes and then these
 * defaults, leaving its output unchanged.
 */
public final class LoginThemeCss {

  private LoginThemeCss() {}

  static final String V2_PREFIX = "_providerConfig.assets.theme.v2.";
  static final String LEGACY_PREFIX = "_providerConfig.assets.login.";

  /**
   * The base color tokens — the ones with a static default. Every other emitted
   * variable derives from one of these (see {@link #DERIVED_FROM}).
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
   * The brand tokens. Brand color is mode-independent (O-5): when a realm sets one of
   * these for light and leaves the dark override unset, dark mode inherits the light
   * value instead of dropping back to the stock dark palette — otherwise a custom
   * brand color would silently revert to the default blue in dark mode.
   */
  static final List<String> BRAND_TOKENS = List.of("primary", "secondary");

  /**
   * Tokens with no static default: when the realm sets none, they fall back to the
   * resolved value of a base token, so a lone custom primary also moves the ring, a
   * lone custom background the card surface, etc. A theme that sets every token
   * explicitly is unaffected; this only matters for realms that set a subset.
   */
  static final Map<String, String> DERIVED_FROM =
      Map.of(
          "card", "background",
          "cardForeground", "foreground",
          "accent", "muted",
          "accentForeground", "foreground",
          "input", "border",
          "ring", "primary");

  /** Base-token light defaults (the default login palette). */
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

  /** Base-token dark defaults. */
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
  // unchecked value like `red}` would terminate the rule early.
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

  /**
   * One mode's resolution: the final value of every token, plus which of them the realm
   * actually set (as opposed to inherited or defaulted). The latter is what drives
   * foreground auto-contrast and dark brand inheritance.
   */
  static final class Resolution {
    final Map<String, String> resolved;
    final Map<String, String> explicit;

    Resolution(Map<String, String> resolved, Map<String, String> explicit) {
      this.resolved = resolved;
      this.explicit = explicit;
    }
  }

  /** Resolve every token for one mode: base tokens then derived. */
  static Map<String, String> resolve(Function<String, String> attr, boolean dark) {
    Resolution light = resolveMode(attr, false, null);
    return dark ? resolveMode(attr, true, light).resolved : light.resolved;
  }

  /**
   * Resolve one mode. {@code light} is the already-resolved light mode when resolving
   * dark, so unset dark brand tokens can inherit it (O-5); null when resolving light.
   */
  static Resolution resolveMode(Function<String, String> attr, boolean dark, Resolution light) {
    Map<String, String> defaults = dark ? DARK_DEFAULTS : LIGHT_DEFAULTS;
    Map<String, String> out = new LinkedHashMap<>();
    Map<String, String> explicit = new LinkedHashMap<>(); // v2/legacy only, pre-default

    // Base tokens: v2 -> legacy -> (dark brand only) the light value -> static default.
    for (String token : BASE_TOKENS) {
      String v2 = attr.apply(V2_PREFIX + (dark ? "dark" + capitalize(token) : token));
      String legacy = null;
      String suffix = LEGACY_SUFFIX.get(token);
      if (suffix != null) {
        legacy = attr.apply(LEGACY_PREFIX + suffix + (dark ? "-dark" : ""));
      }
      String set = pickColor(v2, legacy);
      // A dark brand token the realm left unset inherits the light value it *did* set.
      // Reading light.explicit (not light.resolved) keeps the all-default case on the
      // dark palette, and treating the inherited value as explicit here lets the
      // foreground below auto-contrast against it.
      if (set == null && dark && light != null && BRAND_TOKENS.contains(token)) {
        set = light.explicit.get(token);
      }
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
    return new Resolution(out, explicit);
  }

  private static void autoContrast(
      Map<String, String> out, Map<String, String> explicit, String fg, String bg) {
    if (explicit.get(fg) == null && explicit.get(bg) != null) {
      out.put(fg, contrast(out.get(bg)));
    }
  }

  /** Render the full {@code :root} + {@code .dark} shadcn block for a realm. */
  public static String render(Function<String, String> attr) {
    Resolution light = resolveMode(attr, false, null);
    Resolution dark = resolveMode(attr, true, light);

    String radius = attr.apply(V2_PREFIX + "radius");
    String font = attr.apply(V2_PREFIX + "fontFamily");

    StringBuilder o = new StringBuilder();
    o.append("/* phase-two theme tokens */\n:root {\n");
    expand(o, light.resolved);
    if (isLength(radius)) o.append("  --radius: ").append(radius.trim()).append(";\n");
    if (!Strings.isNullOrEmpty(font)) o.append("  --font-sans: ").append(font.trim()).append(";\n");
    o.append("}\n.dark {\n");
    expand(o, dark.resolved);
    o.append("}\n");
    return o.toString();
  }

  /** Emit the shadcn variables for one resolved mode. */
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
