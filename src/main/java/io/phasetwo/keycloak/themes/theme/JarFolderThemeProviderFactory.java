package io.phasetwo.keycloak.themes.theme;

import com.google.auto.service.AutoService;
import com.google.common.base.Joiner;
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
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.HiddenFileFilter;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.io.monitor.FileAlterationListenerAdaptor;
import org.apache.commons.io.monitor.FileAlterationMonitor;
import org.apache.commons.io.monitor.FileAlterationObserver;
import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.EnvironmentDependentProviderFactory;
import org.keycloak.theme.ClasspathThemeProviderFactory.ThemeRepresentation;
import org.keycloak.theme.ClasspathThemeProviderFactory.ThemesRepresentation;
import org.keycloak.theme.Theme;
import org.keycloak.theme.ThemeProvider;
import org.keycloak.theme.ThemeProviderFactory;
import org.keycloak.util.JsonSerialization;

@JBossLog
@AutoService(ThemeProviderFactory.class)
public class JarFolderThemeProviderFactory extends FileAlterationListenerAdaptor
    implements ThemeProviderFactory, EnvironmentDependentProviderFactory {

  public static final String PROVIDER_ID = "ext-theme-jar-folder";
  public static final String KEYCLOAK_THEMES_JSON = "/META-INF/keycloak-themes.json";

  protected static Map<String, Map<Theme.Type, Map<String, JarFileSystemTheme>>> realmThemes =
      new HashMap<>();
  protected static Map<Theme.Type, Map<String, JarFileSystemTheme>> globalThemes = new HashMap<>();
  protected static Map<Path, FileSystem> jars = new HashMap<>();

  private File rootDir;
  private FileAlterationMonitor monitor;

  @Override
  public void onFileChange(File file) {
    log.infof("onFileChange %s", file);
    onFileModified(isSubDir(file), file.toPath());
  }

  @Override
  public void onFileCreate(File file) {
    log.infof("onFileCreate %s", file);
    onFileModified(isSubDir(file), file.toPath());
  }

  @Override
  public void onFileDelete(File file) {
    log.infof("onFileDelete %s", file);
    onFileRemoved(isSubDir(file), file.toPath());
  }

  private void onFileModified(Optional<String> dir, Path file) {
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
        log.debugf("globalThemes %s", Joiner.on(",").withKeyValueSeparator("=").join(globalThemes));
        log.debugf("realmThemes %s", Joiner.on(",").withKeyValueSeparator("=").join(realmThemes));
      }
      jars.put(file, fs);
    } catch (Exception e) {
      log.errorf(e, "Error getting FileSystem from %s", file);
    }
  }

  private void loadThemes(
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
                  new JarFileSystemTheme(jarFile, fs, realm, themeRep.getName(), type));
        }
      }
    } catch (Exception e) {
      throw new RuntimeException("Failed to load themes", e);
    }
  }

  private void onFileRemoved(Optional<String> dir, Path file) {
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

  private void removeThemesForFile(
      Map<Theme.Type, Map<String, JarFileSystemTheme>> themes, Path file) {
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
  public boolean isSupported(Config.Scope config) {
    try {
      return Files.isDirectory(new File(config.get("dir")).toPath());
    } catch (Exception ignore) {
    }
    return false;
  }

  @Override
  public void init(Config.Scope config) {
    String d = config.get("dir");
    if (d != null) {
      rootDir = new File(d);
    }

    try {
      monitor = new FileAlterationMonitor(60000L); // 1 minute interval
      FileAlterationObserver observer =
          new FileAlterationObserver(rootDir, filterDirectoryAndJar());
      observer.addListener(this);
      monitor.addObserver(observer);
      monitor.start();
    } catch (Exception e) {
      log.error("Error starting directory watcher", e);
      throw new IllegalStateException(e);
    }
  }

  private static IOFileFilter filterDirectoryAndJar() {
    IOFileFilter directories =
        FileFilterUtils.and(FileFilterUtils.directoryFileFilter(), HiddenFileFilter.VISIBLE);
    IOFileFilter files =
        FileFilterUtils.and(
            FileFilterUtils.fileFileFilter(), FileFilterUtils.suffixFileFilter(".jar"));
    return FileFilterUtils.or(directories, files);
  }

  private Optional<String> isSubDir(File file) {
    Path directory = rootDir.toPath();
    Path fullPath = file.toPath();
    Optional<String> subDirName = Optional.empty();
    if (!fullPath.getParent().equals(directory)) {
      subDirName = Optional.of(directory.relativize(fullPath.getParent()).toString());
    }
    return subDirName;
  }

  @Override
  public void postInit(KeycloakSessionFactory factory) {
    // shutdown hook so watcher doesn't hang
    Runtime.getRuntime()
        .addShutdownHook(
            new Thread(
                () -> {
                  if (monitor != null) {
                    try {
                      monitor.stop();
                    } catch (Exception ignore) {
                    }
                  }
                }));
    // bootstrap anything that's already there
    try {
      findFilesAndNotify(rootDir.toPath(), ".jar");
    } catch (IOException e) {
      throw new IllegalStateException("Error finding existing theme jars", e);
    }
  }

  private void findFilesAndNotify(Path directory, String fileType) throws IOException {
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
    if (monitor != null) {
      try {
        monitor.stop();
      } catch (Exception ignore) {
      }
    }
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }
}
