package io.phasetwo.keycloak.themes.theme;

import com.google.common.base.Joiner;
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
      log.debugf("No realm in context, but is resource session? [%b]", this.resourceSession);
    } else {
      this.resourceSession = false;
    }
    this.globalThemes = globalThemes;
    this.realmThemes = realmThemes;
  }

  private static final Theme.Type[] ALLOWED_TYPES = {
    Theme.Type.LOGIN, Theme.Type.EMAIL, Theme.Type.COMMON, Theme.Type.ACCOUNT
  };

  private static boolean isAllowedType(Theme.Type type) {
    for (Theme.Type allowed : ALLOWED_TYPES) {
      if (type == allowed) return true;
    }
    return false;
  }

  private static boolean isClassAndMethodInStack(String className, String methodName) {
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
    return foundFrame.isPresent();
  }

  @Override
  public int getProviderPriority() {
    return 200;
  }

  @Override
  public Theme getTheme(String name, Theme.Type type) throws IOException {
    if (!isAllowedType(type)) return null;
    log.debugf("getTheme %s %s", name, type);
    Map<Theme.Type, Map<String, JarFileSystemTheme>> themes = globalThemes;
    if (themes != null && themes.containsKey(type) && themes.get(type).containsKey(name)) {
      return themes.get(type).get(name);
    }
    if (resourceSession || realm != null) {
      int idx = name.indexOf("--");
      if (idx < 1) return null; // there's no "--"
      if (name.length() < idx + 3) return null; // there's nothing after the "--"
      String realmKey = name.substring(0, idx);
      String themeKey = name.substring(idx + 2);
      log.debugf("resource session for %s %s %s", name, realmKey, themeKey);
      themes = realmThemes.get(realmKey);
      if (themes != null && themes.containsKey(type) && themes.get(type).containsKey(themeKey)) {
        Theme theme = themes.get(type).get(themeKey);
        log.debugf("theme %s for key %s is %s", type, themeKey, theme);
        return theme;
      }
    }
    log.debugf("No theme for %s %s", name, type);
    return null;
  }

  @Override
  public Set<String> nameSet(Theme.Type type) {
    log.debugf("nameSet %s", type);
    Set<String> names = new HashSet<>();
    if (globalThemes.containsKey(type)) {
      names.addAll(globalThemes.get(type).keySet());
    }
    if (realm != null) {
      log.debugf("names for %s", realm.getName());
      Map<Theme.Type, Map<String, JarFileSystemTheme>> themes = realmThemes.get(realm.getName());
      if (themes != null && themes.containsKey(type)) {
        for (String name : themes.get(type).keySet()) {
          names.add(String.format("%s--%s", realm.getName(), name));
        }
      }
    }
    if (names.size() > 0) log.debugf("[%s] nameSet: %s", type, Joiner.on(",").join(names));
    return names;
  }

  @Override
  public boolean hasTheme(String name, Theme.Type type) {
    try {
      Theme theme = getTheme(name, type);
      log.debugf("hasTheme %s %s %b", name, type, theme != null);
      return (theme != null);
    } catch (IOException e) {
      return false;
    }
  }

  @Override
  public void close() {}
}
