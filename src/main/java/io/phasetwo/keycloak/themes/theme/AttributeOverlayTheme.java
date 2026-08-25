package io.phasetwo.keycloak.themes.theme;

import static io.phasetwo.keycloak.themes.theme.AttributeTheme.EMAIL_MESSAGE_ATTRIBUTE_PREFIX;
import static io.phasetwo.keycloak.themes.theme.AttributeTheme.LEGACY_EMAIL_MESSAGE_ATTRIBUTE_PREFIX;
import static io.phasetwo.keycloak.themes.theme.AttributeTheme.REALM_ATTRIBUTE_KEY;
import static io.phasetwo.keycloak.themes.theme.AttributeTheme.templateKey;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.theme.Theme;

/**
 * Overlays realm-attribute email overrides on top of an already resolved {@link Theme}.
 *
 * <p>{@link AttributeTheme} only serves overrides when the realm's email theme is literally named
 * {@code attributes}, which means overrides are silently ignored for every other email theme
 * (including {@code phasetwo-ui}). This decorator makes the override storage theme-independent: an
 * override is consulted <em>on top of</em> the selected theme rather than <em>instead of</em> it, so
 * templates that were never overridden still come from the packaged theme.
 *
 * <p>The attribute keys are unchanged, so realms already using the {@code attributes} theme keep
 * working exactly as before.
 */
@JBossLog
public class AttributeOverlayTheme implements Theme {

  private static final String TMPDIR_PREFIX = "phasetwo-email-overrides";

  private static volatile Path tmpdir;

  private final KeycloakSession session;
  private final String realmName;
  private final Theme delegate;

  /**
   * Wraps {@code delegate} so that realm-attribute overrides take precedence over it. Returns the
   * delegate untouched when there is nothing to wrap, or when it is already wrapped.
   */
  public static Theme wrap(KeycloakSession session, Theme delegate) {
    if (delegate == null || delegate instanceof AttributeOverlayTheme) return delegate;
    return new AttributeOverlayTheme(session, delegate);
  }

  public AttributeOverlayTheme(KeycloakSession session, Theme delegate) {
    this.session = session;
    this.delegate = delegate;
    this.realmName = resolveRealmName(session);
  }

  /**
   * Admin endpoints act on a realm that is not necessarily the context realm, and signal the target
   * realm through a session attribute. Mirrors {@link AttributeTheme}'s resolution so both paths
   * read the same realm.
   */
  private static String resolveRealmName(KeycloakSession session) {
    Object attr = session.getAttribute(REALM_ATTRIBUTE_KEY);
    if (attr != null) return attr.toString();
    return session.getContext().getRealm().getName();
  }

  private Map<String, String> getAttributes() {
    RealmModel realm = session.realms().getRealmByName(realmName);
    return realm == null ? Map.of() : realm.getAttributes();
  }

  private Optional<String> getAttribute(String key) {
    return Optional.ofNullable(getAttributes().get(key));
  }

  private static synchronized Path getTmpDir() throws IOException {
    if (tmpdir == null) {
      tmpdir = Files.createTempDirectory(TMPDIR_PREFIX);
      tmpdir.toFile().deleteOnExit();
    }
    return tmpdir;
  }

  /**
   * Materializes the override to a file, because {@link Theme#getTemplate} hands back a URL.
   *
   * <p>The file is only rewritten when its content actually changed. FreeMarker caches templates by
   * URL and last-modified time, so rewriting unconditionally would invalidate that cache on every
   * email, while never rewriting would serve a stale override after an edit.
   */
  private URL writeOverride(String name, String content) throws IOException {
    Path p = getTmpDir().resolve(realmName).resolve(name);
    byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
    if (Files.exists(p) && Arrays.equals(Files.readAllBytes(p), bytes)) {
      return p.toUri().toURL();
    }
    Files.createDirectories(p.getParent());
    Files.write(p, bytes);
    log.debugf("wrote email template override %s for realm %s", name, realmName);
    return p.toUri().toURL();
  }

  /** Shell every HTML FreeMarker body imports. Overrides go inside it, never replace it. */
  private static final String FREEMARKER_SHELL = "html/template.ftl";

  private static final String FREEMARKER_SHELL_OPEN =
      "<#import \"template.ftl\" as layout>\n<@layout.emailLayout>\n";
  private static final String FREEMARKER_SHELL_CLOSE = "\n</@layout.emailLayout>\n";

  /** The content a template hands to the layout, i.e. the part an override stands in for. */
  private static final Pattern LAYOUT_BLOCK =
      Pattern.compile("(<@layout\\.emailLayout>)(.*)(</@layout\\.emailLayout>)", Pattern.DOTALL);

  @Override
  public URL getTemplate(String name) throws IOException {
    Optional<String> override = getAttribute(templateKey(name));
    if (override.isEmpty()) return delegate.getTemplate(name);
    log.debugf("using email template override for %s in realm %s", name, realmName);
    return writeOverride(name, applyShell(name, override.get()));
  }

  /**
   * Wraps an HTML FreeMarker override in the theme's own {@code template.ftl} layout, so what a
   * realm overrides is the action content and the branded shell (logo, footer, brand colours) still
   * comes from the theme. An override that already imports the layout is left alone, as is anything
   * the shell does not apply to: text bodies (the theme ships no text layout) and mustache bodies
   * (the legacy {@code attributes*} themes, whose bodies are whole documents).
   */
  private String applyShell(String name, String override) throws IOException {
    if (!name.startsWith("html/") || !name.endsWith(".ftl")) return override;
    if (override.contains("layout.emailLayout")) return override;
    if (delegate.getTemplate(FREEMARKER_SHELL) == null) return override;
    log.debugf("wrapping override %s in %s", name, FREEMARKER_SHELL);

    // Substituting into the packaged template keeps everything around the layout block that the
    // content may depend on -- notably the <#assign> preambles that build values like
    // requiredActionsText, which a synthesized wrapper would drop and FreeMarker would then reject
    // as a missing reference.
    String packaged = readDelegate(name);
    if (packaged != null) {
      Matcher m = LAYOUT_BLOCK.matcher(packaged);
      if (m.find()) {
        return packaged.substring(0, m.end(1))
            + "\n"
            + override
            + "\n"
            + packaged.substring(m.start(3));
      }
    }
    return FREEMARKER_SHELL_OPEN + override + FREEMARKER_SHELL_CLOSE;
  }

  private String readDelegate(String name) throws IOException {
    URL u = delegate.getTemplate(name);
    if (u == null) return null;
    try (InputStream in = u.openStream()) {
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  @Override
  public InputStream getResourceAsStream(String path) throws IOException {
    Optional<String> override = getAttribute(templateKey(path));
    if (override.isEmpty()) return delegate.getResourceAsStream(path);
    URL u = getTemplate(path);
    return u == null ? null : u.openConnection().getInputStream();
  }

  /**
   * Attribute message overrides layered over the delegate's messages. Precedence within the message
   * bundles that consume this is unchanged, so realm localization texts still win where they did
   * before.
   */
  @Override
  public Properties getMessages(Locale locale) throws IOException {
    Properties p = new Properties();
    Properties inherited = delegate.getMessages(locale);
    if (inherited != null) p.putAll(inherited);
    p.putAll(attributeMessages());
    return p;
  }

  private Properties attributeMessages() {
    Properties p = new Properties();
    // Newer keys win over the legacy ones when a realm carries both.
    putStripped(p, LEGACY_EMAIL_MESSAGE_ATTRIBUTE_PREFIX + ".");
    putStripped(p, EMAIL_MESSAGE_ATTRIBUTE_PREFIX + ".");
    return p;
  }

  private void putStripped(Properties p, String prefix) {
    getAttributes().entrySet().stream()
        .filter(e -> e.getKey().startsWith(prefix))
        .forEach(e -> p.setProperty(e.getKey().substring(prefix.length()), e.getValue()));
  }

  @Override
  public Properties getMessages(String baseBundlename, Locale locale) throws IOException {
    return delegate.getMessages(baseBundlename, locale);
  }

  /**
   * The FreeMarker path resolves messages through here, not {@link #getMessages(Locale)}, so the
   * attribute overrides have to be applied again -- without this, {@code
   * _providerConfig.theme.email.messages.*} only took effect for mustache-rendered themes.
   *
   * <p>Realm localization texts are re-applied on top, keeping the precedence the mustache path has:
   * Keycloak's own per-locale realm overrides win over a provider-config attribute.
   */
  @Override
  public Properties getEnhancedMessages(RealmModel realm, Locale locale) throws IOException {
    Properties p = new Properties();
    Properties inherited = delegate.getEnhancedMessages(realm, locale);
    if (inherited != null) p.putAll(inherited);
    p.putAll(attributeMessages());
    if (locale != null) {
      p.putAll(realm.getRealmLocalizationTextsByLocale(locale.toLanguageTag()));
    }
    return p;
  }

  @Override
  public String getName() {
    return delegate.getName();
  }

  @Override
  public String getParentName() {
    return delegate.getParentName();
  }

  @Override
  public String getImportName() {
    return delegate.getImportName();
  }

  @Override
  public Type getType() {
    return delegate.getType();
  }

  @Override
  public Properties getProperties() throws IOException {
    return delegate.getProperties();
  }
}
