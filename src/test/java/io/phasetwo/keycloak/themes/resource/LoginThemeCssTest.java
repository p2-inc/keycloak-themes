package io.phasetwo.keycloak.themes.resource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import org.junit.jupiter.api.Test;

/** Pure unit tests for the login theme.v2.* -> shadcn expansion (no container). */
public class LoginThemeCssTest {

  private static Function<String, String> attrs(Map<String, String> m) {
    return m::get;
  }

  private static Map<String, String> map(String... kv) {
    Map<String, String> m = new HashMap<>();
    for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
    return m;
  }

  @Test
  public void emitsLoginPaletteDefaultsWhenNothingSet() {
    String css = LoginThemeCss.render(attrs(map()));

    // Light defaults + a derived variable, then the .dark block.
    assertTrue(css.contains("--primary: #3b82f6;"), css);
    assertTrue(css.contains("--background: #ffffff;"), css);
    assertTrue(css.contains("--sidebar-primary: #3b82f6;"), css);
    assertTrue(css.contains("--popover: #ffffff;"), css);
    assertTrue(css.contains(".dark {"), css);
    assertTrue(css.contains("--background: #0a0a0a;"), css);
    // No radius/font emitted when unset.
    assertFalse(css.contains("--radius:"), css);
    assertFalse(css.contains("--font-sans:"), css);
  }

  @Test
  public void v2TokenDrivesPrimaryAndItsDerivations() {
    String css = LoginThemeCss.render(attrs(map(LoginThemeCss.V2_PREFIX + "primary", "#7c3aed")));

    assertTrue(css.contains("--primary: #7c3aed;"), css);
    assertTrue(css.contains("--ring: #7c3aed;"), css);
    assertTrue(css.contains("--sidebar-primary: #7c3aed;"), css);
  }

  @Test
  public void fallsBackToLegacyLoginColorWhenV2Unset() {
    String css =
        LoginThemeCss.render(attrs(map(LoginThemeCss.LEGACY_PREFIX + "primaryColor", "#ff0000")));
    assertTrue(css.contains("--primary: #ff0000;"), css);
  }

  @Test
  public void v2WinsOverLegacy() {
    String css =
        LoginThemeCss.render(
            attrs(
                map(
                    LoginThemeCss.V2_PREFIX + "primary", "#00ff00",
                    LoginThemeCss.LEGACY_PREFIX + "primaryColor", "#ff0000")));
    assertTrue(css.contains("--primary: #00ff00;"), css);
    assertFalse(css.contains("--primary: #ff0000;"), css);
  }

  @Test
  public void darkOverrideAppliesInDarkBlockOnly() {
    String css =
        LoginThemeCss.render(attrs(map(LoginThemeCss.V2_PREFIX + "darkBackground", "#111827")));
    int darkIdx = css.indexOf(".dark {");
    assertTrue(darkIdx > 0);
    // The dark override shows up in the .dark block, and the light default stays.
    assertTrue(css.substring(darkIdx).contains("--background: #111827;"), css);
    assertTrue(css.substring(0, darkIdx).contains("--background: #ffffff;"), css);
  }

  @Test
  public void darkBrandTokensInheritTheLightValueWhenUnset() {
    // Brand color is mode-independent (O-5): a realm that sets only the light brand
    // color must not revert to the stock blue/navy in dark mode.
    String css =
        LoginThemeCss.render(
            attrs(
                map(
                    LoginThemeCss.V2_PREFIX + "primary", "#7c3aed",
                    LoginThemeCss.V2_PREFIX + "secondary", "#c4b5fd")));
    int darkIdx = css.indexOf(".dark {");
    assertTrue(darkIdx > 0);
    String dark = css.substring(darkIdx);
    assertTrue(dark.contains("--primary: #7c3aed;"), css);
    assertTrue(dark.contains("--secondary: #c4b5fd;"), css);
    // The stock dark brand defaults must not appear.
    assertFalse(dark.contains("--primary: #3b82f6;"), css);
    assertFalse(dark.contains("--secondary: #1e3a5f;"), css);
  }

  @Test
  public void explicitDarkBrandOverrideBeatsTheLightValue() {
    String css =
        LoginThemeCss.render(
            attrs(
                map(
                    LoginThemeCss.V2_PREFIX + "primary", "#7c3aed",
                    LoginThemeCss.V2_PREFIX + "darkPrimary", "#a78bfa")));
    int darkIdx = css.indexOf(".dark {");
    assertTrue(css.substring(0, darkIdx).contains("--primary: #7c3aed;"), css);
    assertTrue(css.substring(darkIdx).contains("--primary: #a78bfa;"), css);
  }

  @Test
  public void darkSurfaceTokensDoNotInheritTheLightValue() {
    // Only brand tokens are mode-independent — a light background must never light up
    // dark mode. Regression guard for the O-5 carve-out.
    String css =
        LoginThemeCss.render(attrs(map(LoginThemeCss.V2_PREFIX + "background", "#fef9c3")));
    int darkIdx = css.indexOf(".dark {");
    assertTrue(css.substring(0, darkIdx).contains("--background: #fef9c3;"), css);
    assertTrue(css.substring(darkIdx).contains("--background: #0a0a0a;"), css);
  }

  @Test
  public void darkForegroundAutoContrastsAgainstAnInheritedBrandColor() {
    // The inherited light brand color drives the dark foreground too, so a pale brand
    // does not end up with white-on-pale text in dark mode.
    String css = LoginThemeCss.render(attrs(map(LoginThemeCss.V2_PREFIX + "primary", "#eeeeee")));
    int darkIdx = css.indexOf(".dark {");
    assertTrue(css.substring(darkIdx).contains("--primary-foreground: #18181b;"), css);
  }

  @Test
  public void allDefaultsKeepTheDarkPaletteForBrandTokens() {
    // Nothing set: dark brand tokens stay on the dark defaults rather than inheriting.
    String css = LoginThemeCss.render(attrs(map()));
    int darkIdx = css.indexOf(".dark {");
    assertTrue(css.substring(darkIdx).contains("--secondary: #1e3a5f;"), css);
  }

  @Test
  public void autoContrastsForegroundWhenBaseSetButForegroundUnset() {
    // A light primary with no explicit primary-foreground -> dark, readable text.
    String css = LoginThemeCss.render(attrs(map(LoginThemeCss.V2_PREFIX + "primary", "#eeeeee")));
    assertTrue(css.contains("--primary-foreground: #18181b;"), css);
  }

  @Test
  public void invalidValueIsTreatedAsUnset() {
    // A value that could break out of the rule is rejected -> default holds.
    String css = LoginThemeCss.render(attrs(map(LoginThemeCss.V2_PREFIX + "primary", "red}; }")));
    assertTrue(css.contains("--primary: #3b82f6;"), css);
    assertFalse(css.contains("red}"), css);
  }

  @Test
  public void explicitLightTokensIsEmptyForAnUnbrandedRealm() {
    // The email templates carry their own defaults, which differ from the login
    // palette. Returning resolved defaults here would restyle every unbranded email.
    assertTrue(LoginThemeCss.explicitLightTokens(attrs(map())).isEmpty());
  }

  @Test
  public void explicitLightTokensReturnsOnlyWhatTheRealmSet() {
    Map<String, String> t =
        LoginThemeCss.explicitLightTokens(
            attrs(
                map(
                    LoginThemeCss.V2_PREFIX + "primary", "#7c3aed",
                    LoginThemeCss.V2_PREFIX + "radius", "1rem")));
    assertEquals("#7c3aed", t.get("primary"));
    assertEquals("1rem", t.get("radius"));
    // Untouched tokens are absent, not defaulted.
    assertFalse(t.containsKey("background"));
    assertFalse(t.containsKey("foreground"));
    assertFalse(t.containsKey("primaryForeground"));
  }

  @Test
  public void explicitLightTokensFallsBackToLegacy() {
    Map<String, String> t =
        LoginThemeCss.explicitLightTokens(
            attrs(map(LoginThemeCss.LEGACY_PREFIX + "primaryColor", "#ff6600")));
    assertEquals("#ff6600", t.get("primary"));
  }

  @Test
  public void explicitLightTokensRejectsInvalidValues() {
    Map<String, String> t =
        LoginThemeCss.explicitLightTokens(
            attrs(
                map(
                    LoginThemeCss.V2_PREFIX + "primary", "red}; }",
                    LoginThemeCss.V2_PREFIX + "radius", "huge")));
    assertTrue(t.isEmpty());
  }

  @Test
  public void explicitLightTokensIgnoresDarkOverrides() {
    // Email is light-only, so a dark-only realm contributes nothing.
    Map<String, String> t =
        LoginThemeCss.explicitLightTokens(
            attrs(map(LoginThemeCss.V2_PREFIX + "darkPrimary", "#a78bfa")));
    assertTrue(t.isEmpty());
  }

  @Test
  public void emitsRadiusAndFontWhenValid() {
    String css =
        LoginThemeCss.render(
            attrs(
                map(
                    LoginThemeCss.V2_PREFIX + "radius", "0.5rem",
                    LoginThemeCss.V2_PREFIX + "fontFamily", "Inter, sans-serif")));
    assertTrue(css.contains("--radius: 0.5rem;"), css);
    assertTrue(css.contains("--font-sans: Inter, sans-serif;"), css);
  }

  @Test
  public void rejectsNonLengthRadius() {
    String css = LoginThemeCss.render(attrs(map(LoginThemeCss.V2_PREFIX + "radius", "huge")));
    assertFalse(css.contains("--radius:"), css);
  }
}
