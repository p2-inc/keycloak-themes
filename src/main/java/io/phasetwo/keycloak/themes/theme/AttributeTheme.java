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
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.theme.Theme;

/** */
@JBossLog
public class AttributeTheme implements Theme {

  public static final String REALM_ATTRIBUTE_KEY = "attribute-theme-realm";

  private final KeycloakSession session;
  private final String name;
  private final Theme.Type type;

  private String realm;
  private File realmdir;

  public AttributeTheme(KeycloakSession session, String name, Theme.Type type) {
    this.name = name;
    this.type = type;
    this.session = session;
    this.realm = session.getContext().getRealm().getName();
  }

  private Map<String, String> getAttributes() {
    Map<String, String> attrs = session.realms().getRealmByName(useRealm()).getAttributes();
    return attrs;
  }

  private String useRealm() {
    Object attr = session.getAttribute(REALM_ATTRIBUTE_KEY);
    String useRealm = realm;
    if (attr != null) {
      useRealm = attr.toString();
    }
    return useRealm;
  }

  private synchronized File getRealmDir() {
    if (this.realmdir == null) {
      try {
        Path dir = Files.createTempDirectory(useRealm());
        this.realmdir = Files.exists(dir) ? dir.toFile() : Files.createDirectory(dir).toFile();
      } catch (IOException e) {
        throw new IllegalStateException(e);
      }
    }
    return this.realmdir;
  }

  private String getAttribute(String key, String defaultValue) {
    return getAttribute(key).orElse(defaultValue);
  }

  private Optional<String> getAttribute(String key) {
    String attr = getAttributes().get(key);
    log.debugf("got attribute for key %s -> %s", key, attr);
    return Optional.ofNullable(attr);
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

  public static final String EMAIL_TEMPLATE_ATTRIBUTE_PREFIX = "_providerConfig.templates.email";
  public static final String EMAIL_MESSAGE_ATTRIBUTE_PREFIX = "_providerConfig.messages.email";

  public static String templateKey(String templateName) {
    return String.format("%s.%s", EMAIL_TEMPLATE_ATTRIBUTE_PREFIX, templateName);
  }

  public static String messageKey(String messageName) {
    return String.format("%s.%s", EMAIL_MESSAGE_ATTRIBUTE_PREFIX, messageName);
  }

  private boolean copyAttributeToFile(String name) {
    Optional<String> attr = getAttribute(templateKey(name));
    log.debugf("attribute %s (%s) is %s", name, templateKey(name), attr.orElse("[empty]"));
    if (!attr.isPresent()) return false;
    attr.ifPresent(
        a -> {
          try {
            Path p = getRealmDir().toPath().resolve(name);
            if (Files.exists(p)) {
              Files.deleteIfExists(p);
            }
            Files.createDirectories(p.getParent());
            Files.write(p, a.getBytes(StandardCharsets.UTF_8));
          } catch (IOException e) {
            log.warn("Error copying attribute to file", e);
          }
        });
    return true;
  }

  @Override
  public URL getTemplate(String name) throws IOException {
    log.debugf("getTemplate %s", name);
    if (!copyAttributeToFile(name)) return null;
    File file = new File(getRealmDir(), name);
    return file.isFile() ? file.toURI().toURL() : null;
  }

  @Override
  public InputStream getResourceAsStream(String path) throws IOException {
    log.debugf("getResourceAsStream %s", path);
    URL u = getTemplate(path);
    if (u == null) return null;
    return u.openConnection().getInputStream();
  }

  @Override
  public Properties getMessages(Locale locale) throws IOException {
    Properties p = new Properties();
    getAttributes().entrySet().stream()
        .filter(e -> e.getKey().startsWith("_providerConfig.messages.email."))
        .forEach(
            e -> {
              String key = e.getKey().substring(31);
              log.debugf("Adding property to bundle %s => %s", key, e.getValue());
              p.setProperty(key, e.getValue());
            });
    return p;
  }

  @Override
  public Properties getMessages(String baseBundlename, Locale locale) throws IOException {
    return null;
  }

  @Override
  public Properties getEnhancedMessages(RealmModel realm, Locale locale) throws IOException {
    return null;
  }

  @Override
  public Properties getProperties() {
    Properties p = new Properties();
    p.setProperty("parent", getParentName());
    return p;
  }
}
