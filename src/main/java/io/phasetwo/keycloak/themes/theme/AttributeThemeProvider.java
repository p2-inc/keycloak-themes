package io.phasetwo.keycloak.themes.theme;

import com.google.common.collect.ImmutableSet;
import com.google.common.io.Files;
import java.io.File;
import java.io.IOException;
import java.util.Set;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.theme.Theme;
import org.keycloak.theme.ThemeProvider;

/** */
@JBossLog
public class AttributeThemeProvider implements ThemeProvider {

  private final KeycloakSession session;
  private final File tmpdir;

  public AttributeThemeProvider(KeycloakSession session) {
    this.session = session;
    this.tmpdir = Files.createTempDir();
  }

  public File getTmpDir() {
    return this.tmpdir;
  }

  @Override
  public int getProviderPriority() {
    return 200; // what does this do?
  }

  @Override
  public Theme getTheme(String name, Theme.Type type) throws IOException {
    if (!hasTheme(name, type)) return null;
    log.debugf("Creating AttributeTheme for %s", session.getContext().getRealm().getName());
    return new AttributeTheme(session, tmpdir, name, type);
  }

  public static final String ATTRIBUTE_THEME_NAME = "attributes";

  /**
   * Legacy attribute theme names. Neither ships a packaged email theme, so claiming them here
   * shadows nothing -- realms still selecting them get attribute-backed templates instead of
   * silently falling back to the stock Keycloak email theme. Themes that do ship email templates
   * (e.g. phasetwo-ui) must NOT be listed: this provider outranks the folder/jar providers, so it
   * would hide the real theme and its parent chain. Those get their overrides from
   * AttributeOverlayTheme instead.
   */
  public static final Set<String> ATTRIBUTE_NAME_SET =
      ImmutableSet.of(ATTRIBUTE_THEME_NAME, "attributes-v2");

  @Override
  public Set<String> nameSet(Theme.Type type) {
    if (type == Theme.Type.EMAIL) return ATTRIBUTE_NAME_SET;
    else return ImmutableSet.of();
  }

  @Override
  public boolean hasTheme(String name, Theme.Type type) {
    return (type == Theme.Type.EMAIL && ATTRIBUTE_NAME_SET.contains(name.toLowerCase()));
  }

  @Override
  public void close() {
    log.trace("Attempting to recursively delete tmpdir");
    try {
      AttributeThemeProviderFactory.deleteRecursively(tmpdir);
    } catch (Exception e) {
      log.warnf(e, "Error removing tmpdir", tmpdir);
    }
  }
}
