package io.phasetwo.keycloak.themes.theme;

import com.google.common.collect.ImmutableMap;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.theme.ClasspathThemeProviderFactory.ThemeRepresentation;
import org.keycloak.theme.ClasspathThemeProviderFactory.ThemesRepresentation;
import org.keycloak.theme.Theme;
import org.keycloak.theme.ThemeProvider;
import org.keycloak.theme.ThemeProviderFactory;
import org.keycloak.util.JsonSerialization;

@JBossLog
public class JarFolderThemeProviderFactory
    implements ThemeProviderFactory, DirectoryWatcher.FileEventListener {

  public static final String PROVIDER_ID = "ext-theme-provider-jar";
  public static final String KEYCLOAK_THEMES_JSON = "/META-INF/keycloak-themes.json";

  protected static Map<String, Map<Theme.Type, Map<String, JarFileSystemTheme>>> realmThemes =
      new HashMap<>();
  protected static Map<Theme.Type, Map<String, JarFileSystemTheme>> globalThemes = new HashMap<>();
  protected static Set<Path> jars = new HashSet<>();

  private File rootDir;
  private DirectoryWatcher watcher;

  @Override
  public void onFileModified(Optional<String> dir, Path file) {
    try {
      FileSystem fs = FileSystems.newFileSystem(file.toUri(), ImmutableMap.of(), null);
      Path themeManifest = fs.getPath(KEYCLOAK_THEMES_JSON);
      try (InputStream inputStream = Files.newInputStream(themeManifest)) {
        loadThemes(
            file, fs, dir, JsonSerialization.readValue(inputStream, ThemesRepresentation.class));
      }
      jars.add(file);
    } catch (Exception e) {
      log.warnf(e, "Error getting FileSystem from %s", file);
    }
  }

  protected void loadThemes(
      Path jarFile, FileSystem fs, Optional<String> realm, ThemesRepresentation themesRep) {
    Map<Theme.Type, Map<String, JarFileSystemTheme>> themes =
        realm.isPresent() ? realmThemes.get(realm.get()) : globalThemes;
    if (themes == null) {
      themes = new HashMap<Theme.Type, Map<String, JarFileSystemTheme>>();
      if (realm.isPresent()) {
        realmThemes.put(realm.get(), themes);
      }
    }

    try {
      for (ThemeRepresentation themeRep : themesRep.getThemes()) {
        for (String t : themeRep.getTypes()) {
          Theme.Type type = Theme.Type.valueOf(t.toUpperCase());
          if (!themes.containsKey(type)) {
            themes.put(type, new HashMap<>());
          }
          themes
              .get(type)
              .put(
                  themeRep.getName(),
                  new JarFileSystemTheme(jarFile, fs, themeRep.getName(), type));
        }
      }
    } catch (Exception e) {
      throw new RuntimeException("Failed to load themes", e);
    }
  }

  @Override
  public void onFileRemoved(Optional<String> dir, Path file) {
    // walk the tree and remove

  }

  @Override
  public ThemeProvider create(KeycloakSession session) {
    return new JarFolderThemeProvider(session, globalThemes, realmThemes);
  }

  @Override
  public void init(Config.Scope config) {
    String d = config.get("dir");
    if (d != null) {
      this.rootDir = new File(d);
    }
    try {
      this.watcher = new DirectoryWatcher(this.rootDir.toPath(), this, ".jar");
    } catch (IOException e) {
      log.error("Error starting directory watcher", e);
      throw new IllegalStateException(e);
    }
  }

  @Override
  public void postInit(KeycloakSessionFactory factory) {
    Runtime.getRuntime()
        .addShutdownHook(
            new Thread(
                () -> {
                  if (watcher != null) {
                    watcher.stopWatching();
                  }
                }));
  }

  @Override
  public void close() {
    if (watcher != null) {
      watcher.stopWatching(); // Ensure the watcher is stopped if any error occurs
    }
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }
}
