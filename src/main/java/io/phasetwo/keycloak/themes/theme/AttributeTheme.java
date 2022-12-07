package io.phasetwo.keycloak.themes.theme;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Optional;
import java.util.Properties;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.theme.Theme;

/** */
@JBossLog
public class AttributeTheme implements Theme {

  private final KeycloakSession session;
  private final File tmpdir;
  private final File realmdir;
  private final String name;
  private final Theme.Type type;

  public AttributeTheme(KeycloakSession session, File tmpdir, String name, Theme.Type type) {
    this.session = session;
    this.tmpdir = tmpdir;
    this.name = name;
    this.type = type;
    this.realmdir = createRealmDir();
  }

  private File createRealmDir() {
    try {
      Path dir = Paths.get(tmpdir.getAbsolutePath(), session.getContext().getRealm().getName());
      if (Files.exists(dir)) return dir.toFile();
      else return Files.createDirectory(dir).toFile();
    } catch (IOException e) {
      throw new IllegalStateException(e);
    }
  }

  private String getAttribute(String key, String defaultValue) {
    return getAttribute(key).orElse(defaultValue);
  }

  private Optional<String> getAttribute(String key) {
    return Optional.ofNullable(session.getContext().getRealm().getAttribute(key));
  }

  @Override
  public String getName() {
    return name;
  }

  @Override
  public String getParentName() {
    return getAttribute("_providerConfig.theme.email.parent", "mustache");
  }

  @Override
  public String getImportName() {
    return null;
  }

  @Override
  public Type getType() {
    return type;
  }

  private String templateKey(String templateName) {
    return String.format("_providerConfig.templates.email.%s", templateName);
  }

  private String messageKey(String messageName) {
    return String.format("_providerConfig.messages.email.%s", messageName);
  }

  private boolean copyAttributeToFile(String name) {
    Optional<String> attr = getAttribute(templateKey(name));
    if (!attr.isPresent()) return false;
    attr.ifPresent(
        a -> {
          try {
            Path p = realmdir.toPath().resolve(name);
            if (Files.exists(p)) {
              Files.deleteIfExists(p);
            }
            Files.write(p, a.getBytes(StandardCharsets.UTF_8));
          } catch (IOException e) {
            log.warn("Error copying attribute to file", e);
          }
        });
    return true;
  }

  @Override
  public URL getTemplate(String name) throws IOException {
    log.infof("getTemplate %s", name);
    if (!copyAttributeToFile(name)) return null;
    File file = new File(realmdir, name);
    return file.isFile() ? file.toURI().toURL() : null;
  }

  @Override
  public InputStream getResourceAsStream(String path) throws IOException {
    log.infof("getResourceAsStream %s", path);
    URL u = getTemplate(path);
    if (u == null) return null;
    return u.openConnection().getInputStream();
  }

  @Override
  public Properties getMessages(Locale locale) throws IOException {
    Properties p = new Properties();
    session.getContext().getRealm().getAttributes().entrySet().stream()
        .filter(e -> e.getKey().startsWith("_providerConfig.messages.email."))
        .forEach(
            e -> {
              String key = e.getKey().substring(31);
              log.infof("Adding property to bundle %s => %s", key, e.getValue());
              p.setProperty(key, e.getValue());
            });
    return p;
  }

  @Override
  public Properties getMessages(String baseBundlename, Locale locale) throws IOException {
    return null;
  }

  @Override
  public Properties getProperties() {
    Properties p = new Properties();
    p.setProperty("parent", getParentName());
    return p;
  }
}
