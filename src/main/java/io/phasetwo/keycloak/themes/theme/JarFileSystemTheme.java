package io.phasetwo.keycloak.themes.theme;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.FileSystem;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Pattern;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.RealmModel;
import org.keycloak.services.util.LocaleUtil;
import org.keycloak.theme.PropertiesUtil;
import org.keycloak.theme.Theme;

@JBossLog
public class JarFileSystemTheme implements Theme {

  private final Path jarFile;
  private final FileSystem fileSystem;
  private final String name;
  private final Type type;
  private final Path themeDir;
  private final Path resourcesDir;
  private final Properties properties;
  private String parentName;
  private String importName;

  public JarFileSystemTheme(Path jarFile, FileSystem fileSystem, String name, Type type) {
    this.themeDir = themeDir(fileSystem, name, type);
    this.jarFile = jarFile;
    this.fileSystem = fileSystem;
    this.name = name;
    this.type = type;
    this.properties = new Properties();

    Path propertiesFile = themeDir.resolve("theme.properties");
    try {
      if (Files.isRegularFile(propertiesFile)) {
        try (InputStream stream = Files.newInputStream(propertiesFile)) {
          PropertiesUtil.readCharsetAware(properties, stream);
        }
        this.parentName = properties.getProperty("parent");
        this.importName = properties.getProperty("import");
      }
    } catch (IOException e) {
      log.warn("Error loading theme.properties", e);
    }
    this.resourcesDir = themeDir.resolve("resources");
  }

  static Path themeDir(FileSystem fileSystem, String name, Type type) {
    return fileSystem.getPath("/theme", name, type.name().toLowerCase());
  }

  public Path getJarFile() {
    return jarFile;
  }

  public FileSystem getFileSystem() {
    return fileSystem;
  }

  @Override
  public String getName() {
    return name;
  }

  @Override
  public String getParentName() {
    return parentName;
  }

  @Override
  public String getImportName() {
    return importName;
  }

  @Override
  public Type getType() {
    return type;
  }

  @Override
  public URL getTemplate(String name) throws IOException {
    Path file = themeDir.resolve(name);
    log.debugf("getTemplate %s from %s", name, file);
    return Files.isRegularFile(file) ? file.toUri().toURL() : null;
  }

  @Override
  public InputStream getResourceAsStream(String path) throws IOException {
    log.infof("getResourceAsStream %s", path);
    Path resource = resourcesDir.resolve(path);
    log.infof("getResourceAsStream %s from %s", resource, path);
    return Files.isRegularFile(resource) ? Files.newInputStream(resource) : null;
  }

  @Override
  public Properties getMessages(Locale locale) throws IOException {
    return getMessages("messages", locale);
  }

  private static final Pattern LEGAL_LOCALE = Pattern.compile("[a-zA-Z0-9-_#]*");

  @Override
  public Properties getMessages(String baseBundlename, Locale locale) throws IOException {
    if (locale == null) {
      return null;
    }

    Properties m = new Properties();
    String filename = baseBundlename + "_" + locale;
    if (!LEGAL_LOCALE.matcher(filename).matches()) {
      throw new RuntimeException("Found illegal characters in locale or bundle name: " + filename);
    }

    Path file = themeDir.resolve("messages" + File.separator + filename + ".properties");
    if (Files.isRegularFile(file)) {
      try (InputStream stream = Files.newInputStream(file)) {
        PropertiesUtil.readCharsetAware(m, stream);
      }
    }
    return m;
  }

  @Override
  public Properties getEnhancedMessages(RealmModel realm, Locale locale) throws IOException {
    if (locale == null) {
      return null;
    }

    Map<Locale, Properties> localeMessages = Collections.singletonMap(locale, getMessages(locale));
    return LocaleUtil.enhancePropertiesWithRealmLocalizationTexts(realm, locale, localeMessages);
  }

  @Override
  public Properties getProperties() {
    return properties;
  }
}
