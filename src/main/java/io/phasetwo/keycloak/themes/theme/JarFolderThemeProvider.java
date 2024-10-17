package io.phasetwo.keycloak.themes.theme;

import java.io.IOException;
import java.lang.StackWalker.StackFrame;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
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
  private final boolean resourceSession;

  public JarFolderThemeProvider(
      KeycloakSession session,
      Map<Theme.Type, Map<String, JarFileSystemTheme>> globalThemes,
      Map<String, Map<Theme.Type, Map<String, JarFileSystemTheme>>> realmThemes) {
    this.session = session;
    this.realm = session.getContext().getRealm();
    if (realm == null) {
      this.resourceSession =
          isClassAndMethodInStack("org.keycloak.services.resources.ThemeResource", "getResource");
      log.infof("No realm in context, but is resource session? [%b]", this.resourceSession);
    } else {
      this.resourceSession = false;
    }
    this.globalThemes = globalThemes;
    this.realmThemes = realmThemes;
  }

  static final Theme.Type[] ALLOWED_TYPES = {
    Theme.Type.LOGIN, Theme.Type.EMAIL, Theme.Type.COMMON, Theme.Type.ACCOUNT
  };

  static boolean isAllowedType(Theme.Type type) {
    for (Theme.Type allowed : ALLOWED_TYPES) {
      if (type == allowed) return true;
    }
    return false;
  }

  static boolean isClassAndMethodInStack(String className, String methodName) {
    // Use StackWalker to get the stack frames
    Optional<StackFrame> foundFrame =
        StackWalker.getInstance()
            .walk(
                frames ->
                    frames
                        .filter(
                            frame ->
                                frame.getClassName().equals(className)
                                    && frame.getMethodName().equals(methodName))
                        .findFirst());

    // If the frame was found, return true
    return foundFrame.isPresent();
  }

  @Override
  public int getProviderPriority() {
    return 200;
  }

  @Override
  public Theme getTheme(String name, Theme.Type type) throws IOException {
    if (!isAllowedType(type)) return null;
    log.infof("getTheme %s %s", name, type);
    Map<Theme.Type, Map<String, JarFileSystemTheme>> themes = globalThemes;
    if (themes != null && themes.containsKey(type) && themes.get(type).containsKey(name)) {
      return themes.get(type).get(name);
    }
    if (resourceSession) {
      int idx = name.indexOf("--");
      if (idx < 1) return null;
      String k = name.substring(0, idx);
      log.infof("resource session for %s %s", name, k);
      themes = realmThemes.get(k);
    } else if (realm != null) {
      themes = realmThemes.get(realm.getName());
    } else {
      themes = null;
    }
    if (themes != null && themes.containsKey(type) && themes.get(type).containsKey(name)) {
      return themes.get(type).get(name);
    }
    return null;
  }

  @Override
  public Set<String> nameSet(Theme.Type type) {
    log.infof("nameSet %s %s", type);
    Set<String> names = new HashSet<>();
    if (globalThemes.containsKey(type)) {
      names.addAll(globalThemes.get(type).keySet());
    }
    if (realm == null) return names;
    Map<Theme.Type, Map<String, JarFileSystemTheme>> themes = realmThemes.get(realm.getName());
    if (themes != null && themes.containsKey(type)) {
      for (String name : themes.get(type).keySet()) {
        names.add(String.format("%s--%s", realm.getName(), name));
      }
    }
    return names;
  }

  @Override
  public boolean hasTheme(String name, Theme.Type type) {
    log.infof("hasTheme %s %s", name, type);
    try {
      return (getTheme(name, type) != null);
    } catch (IOException e) {
      return false;
    }
  }

  @Override
  public void close() {}
}
