package io.phasetwo.keycloak.themes.theme;

import java.io.IOException;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.theme.Theme;
import org.keycloak.theme.ThemeProvider;

@JBossLog
public class JarFolderThemeProvider implements ThemeProvider {

  private final Map<String, Map<Theme.Type, Map<String, JarFileSystemTheme>>> realmThemes;
  private final Map<Theme.Type, Map<String, JarFileSystemTheme>> globalThemes;
  private final KeycloakSession session;
  private final RealmModel realm;

  public JarFolderThemeProvider(
      KeycloakSession session,
      Map<Theme.Type, Map<String, JarFileSystemTheme>> globalThemes,
      Map<String, Map<Theme.Type, Map<String, JarFileSystemTheme>>> realmThemes) {
    this.session = session;
    this.realm = session.getContext().getRealm();
    if (realm == null) {
      log.warn("No realm in context");
    }
    this.globalThemes = globalThemes;
    this.realmThemes = realmThemes;
  }

  @Override
  public int getProviderPriority() {
    return 0;
  }

  @Override
  public Theme getTheme(String name, Theme.Type type) throws IOException {
    Map<Theme.Type, Map<String, JarFileSystemTheme>> themes = globalThemes;
    if (themes != null && themes.containsKey(type) && themes.get(type).containsKey(name)) {
      return themes.get(type).get(name);
    }
    themes = realmThemes.get(realm.getName());
    if (themes != null && themes.containsKey(type) && themes.get(type).containsKey(name)) {
      return themes.get(type).get(name);
    }
    return null;
  }

  @Override
  public Set<String> nameSet(Theme.Type type) {
    Set<String> names = new HashSet<>();
    if (globalThemes.containsKey(type)) {
      names.addAll(globalThemes.get(type).keySet());
    }
    Map<Theme.Type, Map<String, JarFileSystemTheme>> themes = realmThemes.get(realm.getName());
    if (themes != null && themes.containsKey(type)) {
      names.addAll(themes.get(type).keySet());
    }
    return names;
  }

  @Override
  public boolean hasTheme(String name, Theme.Type type) {
    try {
      return (getTheme(name, type) != null);
    } catch (IOException e) {
      return false;
    }
  }

  @Override
  public void close() {}
}
