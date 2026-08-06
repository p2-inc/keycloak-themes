package io.phasetwo.keycloak.themes.resource;

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
