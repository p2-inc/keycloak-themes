package io.phasetwo.keycloak.themes.theme;

import com.google.auto.service.AutoService;
import com.google.common.collect.ImmutableMap;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitOption;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
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
@AutoService(ThemeProviderFactory.class)
public class JarFolderThemeProviderFactory
    implements ThemeProviderFactory, DirectoryWatcher.FileEventListener {

  public static final String PROVIDER_ID = "ext-theme-jar-folder";
  public static final String KEYCLOAK_THEMES_JSON = "/META-INF/keycloak-themes.json";

  protected static Map<String, Map<Theme.Type, Map<String, JarFileSystemTheme>>> realmThemes =
      new HashMap<>();
  protected static Map<Theme.Type, Map<String, JarFileSystemTheme>> globalThemes = new HashMap<>();
  protected static Map<Path, FileSystem> jars = new HashMap<>();

  private File rootDir;
  private DirectoryWatcher watcher;

  @Override
  public void onFileModified(Optional<String> dir, Path file) {
    // TODO is the dir a real realm?
    try {
      if (!Files.exists(file) || Files.size(file) == 0) {
        log.info("File doesn't exist or is zero size");
        return;
      }
      log.infof("onFileModified %s %s", file, dir.orElse("[root]"));
      String uriString = String.format("jar:file:%s", file.toAbsolutePath());
      log.infof("attempting FileSystem from %s", uriString);
      URI uri = URI.create(uriString);
      FileSystem fs = FileSystems.newFileSystem(uri, ImmutableMap.of());
      Path themeManifest = fs.getPath(KEYCLOAK_THEMES_JSON);
      log.infof(
          "theme manifest %s %b %b",
          themeManifest, Files.isReadable(themeManifest), Files.isRegularFile(themeManifest));
      try (InputStream inputStream = Files.newInputStream(themeManifest)) {
        loadThemes(
            file, fs, dir, JsonSerialization.readValue(inputStream, ThemesRepresentation.class));
      }
      jars.put(file, fs);
    } catch (Exception e) {
      log.errorf(e, "Error getting FileSystem from %s", file);
    }
  }

  void loadThemes(
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
        log.infof(
            "%d types for theme %s in %s", themeRep.getTypes().length, themeRep.getName(), jarFile);
        for (String t : themeRep.getTypes()) {
          Theme.Type type = Theme.Type.valueOf(t.toUpperCase());
          log.infof("loading theme %s %s", themeRep.getName(), type);
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
    FileSystem fs = jars.remove(file);
    if (fs == null) {
      log.infof("No FileSystem for %s", file);
      return;
    }
    log.infof("onFileRemoved %s %s", file, dir.orElse("[root]"));

    // remove from globalThemes
    removeThemesForFile(globalThemes, file);

    // remove from realmThemes
    for (Map<Theme.Type, Map<String, JarFileSystemTheme>> themes : realmThemes.values()) {
      removeThemesForFile(themes, file);
    }

    // close the FileSystem
    try {
      if (!Files.exists(file) || !Files.isRegularFile(file)) {
        // We have to create a temp/empty file because of this bug
        // https://bugs.openjdk.org/browse/JDK-8291712
        Files.createFile(file);
      }
      if (fs.isOpen()) {
        fs.close();
      }
      Files.deleteIfExists(file);
    } catch (IOException e) {
      log.errorf(e, "Error closing FileSystem for %s", file);
    }
  }

  void removeThemesForFile(Map<Theme.Type, Map<String, JarFileSystemTheme>> themes, Path file) {
    for (Map<String, JarFileSystemTheme> themesOfType : themes.values()) {
      Iterator<Map.Entry<String, JarFileSystemTheme>> iterator = themesOfType.entrySet().iterator();
      while (iterator.hasNext()) {
        Map.Entry<String, JarFileSystemTheme> entry = iterator.next();
        int comp = entry.getValue().getJarFile().compareTo(file);
        if (comp == 0) {
          log.infof("Found %s theme with jarFile %s, removing", entry.getKey(), file);
          iterator.remove();
        }
      }
    }
  }

  @Override
  public ThemeProvider create(KeycloakSession session) {
    return new JarFolderThemeProvider(session, globalThemes, realmThemes);
  }

  @Override
  public void init(Config.Scope config) {
    String d = config.get("dir");
    if (d != null) {
      rootDir = new File(d);
    }
    try {
      watcher = new DirectoryWatcher(rootDir.toPath(), this, ".jar");
      new Thread(watcher).start();
    } catch (IOException e) {
      log.error("Error starting directory watcher", e);
      throw new IllegalStateException(e);
    }
  }

  @Override
  public void postInit(KeycloakSessionFactory factory) {
    // shutdown hook so watcher doesn't hang
    Runtime.getRuntime()
        .addShutdownHook(
            new Thread(
                () -> {
                  if (watcher != null && watcher.isRunning()) {
                    watcher.stopWatching();
                  }
                }));
    // bootstrap anything that's already there
    try {
      findFilesAndNotify(rootDir.toPath(), ".jar");
    } catch (IOException e) {
      throw new IllegalStateException("Error finding existing theme jars", e);
    }
  }

  void findFilesAndNotify(Path directory, String fileType) throws IOException {
    Files.walkFileTree(
        directory,
        EnumSet.noneOf(FileVisitOption.class),
        2,
        new SimpleFileVisitor<>() {
          @Override
          public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
            if (file.toString().endsWith(fileType)) {
              Optional<String> subDir = Optional.empty();
              if (!file.getParent().equals(directory)) {
                subDir = Optional.of(directory.relativize(file.getParent()).toString());
              }
              onFileModified(subDir, file);
            }
            return FileVisitResult.CONTINUE;
          }

          @Override
          public FileVisitResult visitFileFailed(Path file, IOException exc) {
            return FileVisitResult.CONTINUE;
          }
        });
  }

  @Override
  public void close() {
    if (watcher != null && watcher.isRunning()) {
      watcher.stopWatching();
    }
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }
}
