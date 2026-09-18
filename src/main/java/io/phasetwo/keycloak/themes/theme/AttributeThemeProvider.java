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
  private File tmpdir;

  public AttributeThemeProvider(KeycloakSession session) {
    this.session = session;
  }

  /**
   * Lazily creates the scratch directory backing {@link AttributeTheme}.
   *
   * <p>Keycloak instantiates every registered {@link ThemeProvider} on each theme resolution, then
   * asks each one whether it has the theme. This provider only ever answers yes for {@link
   * Theme.Type#EMAIL}, so creating the directory in the constructor meant one uniquely-named
   * directory per page render -- login and account renders included, which this provider never
   * serves. Every distinct name costs a dentry and an inode in the kernel cache, and because the
   * names never repeat that cache grows without bound. Creating it here instead means it is only
   * created when a theme is actually served.
   */
  public synchronized File getTmpDir() {
    if (tmpdir == null) {
      tmpdir = Files.createTempDir();
    }
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
    return new AttributeTheme(session, getTmpDir(), name, type);
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
  public synchronized void close() {
    if (tmpdir == null) {
      // Nothing was ever served, so no directory was created.
      return;
    }
    log.trace("Attempting to recursively delete tmpdir");
    try {
      AttributeThemeProviderFactory.deleteRecursively(tmpdir);
    } catch (Exception e) {
      log.warnf(e, "Error removing tmpdir", tmpdir);
    }
  }
}
