package io.phasetwo.keycloak.themes.theme;

import static io.phasetwo.keycloak.themes.theme.AttributeTheme.EMAIL_MESSAGE_ATTRIBUTE_PREFIX;
import static io.phasetwo.keycloak.themes.theme.AttributeTheme.templateKey;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.google.common.io.Resources;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RealmProvider;
import org.keycloak.theme.Theme;

/**
 * The overlay's contract: a realm attribute stands in for the body of a template, and for an HTML
 * FreeMarker body it is placed inside the theme's own layout rather than replacing it.
 */
class AttributeOverlayThemeTest {

  private static final String REALM = "test-realm";

  @TempDir Path tmp;

  private final Map<String, String> attributes = new HashMap<>();
  private KeycloakSession session;
  private Theme delegate;

  @BeforeEach
  void setUp() {
    RealmModel realm = mock(RealmModel.class);
    when(realm.getAttributes()).thenReturn(attributes);

    RealmProvider realms = mock(RealmProvider.class);
    when(realms.getRealmByName(REALM)).thenReturn(realm);

    KeycloakContext context = mock(KeycloakContext.class);
    when(context.getRealm()).thenReturn(realm);
    when(realm.getName()).thenReturn(REALM);

    session = mock(KeycloakSession.class);
    when(session.realms()).thenReturn(realms);
    when(session.getContext()).thenReturn(context);
    when(session.getAttribute(anyString())).thenReturn(null);

    delegate = mock(Theme.class);
    when(delegate.getName()).thenReturn("phasetwo-ui");
  }

  private URL fileUrl(String name, String content) throws IOException {
    Path p = tmp.resolve(name);
    Files.createDirectories(p.getParent());
    Files.writeString(p, content);
    return p.toUri().toURL();
  }

  private String read(URL u) throws IOException {
    return Resources.toString(u, StandardCharsets.UTF_8);
  }

  @Test
  void withoutAnOverride_delegatesToTheTheme() throws Exception {
    URL packaged = fileUrl("html/password-reset.ftl", "the packaged template");
    when(delegate.getTemplate("html/password-reset.ftl")).thenReturn(packaged);

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);

    assertThat(read(overlay.getTemplate("html/password-reset.ftl")), is("the packaged template"));
  }

  @Test
  void htmlFreeMarkerOverride_isPlacedInsideTheThemeLayout() throws Exception {
    when(delegate.getTemplate("html/template.ftl"))
        .thenReturn(fileUrl("html/template.ftl", "the shell"));
    attributes.put(templateKey("html/password-reset.ftl"), "<p>my content</p>");

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);
    String rendered = read(overlay.getTemplate("html/password-reset.ftl"));

    assertThat(rendered, containsString("<#import \"template.ftl\" as layout>"));
    assertThat(rendered, containsString("<@layout.emailLayout>"));
    assertThat(rendered, containsString("<p>my content</p>"));
    assertThat(rendered, containsString("</@layout.emailLayout>"));
  }

  /**
   * The content an override replaces can depend on assigns the packaged template makes above the
   * layout block (executeActions builds requiredActionsText that way). Dropping them renders as a
   * FreeMarker missing-reference failure, not a cosmetic difference.
   */
  @Test
  void htmlFreeMarkerOverride_keepsThePackagedTemplatePreamble() throws Exception {
    String packaged =
        "<#assign requiredActionsText>a, b</#assign>\n"
            + "<#import \"template.ftl\" as layout>\n"
            + "<@layout.emailLayout>\n"
            + "${msg(\"executeActionsBodyHtml\", link)}\n"
            + "</@layout.emailLayout>\n";
    when(delegate.getTemplate("html/executeActions.ftl"))
        .thenReturn(fileUrl("html/executeActions.ftl", packaged));
    when(delegate.getTemplate("html/template.ftl"))
        .thenReturn(fileUrl("html/template.ftl", "the shell"));
    attributes.put(
        templateKey("html/executeActions.ftl"), "<p>You must: ${requiredActionsText}</p>");

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);
    String rendered = read(overlay.getTemplate("html/executeActions.ftl"));

    assertThat(rendered, containsString("<#assign requiredActionsText>"));
    assertThat(rendered, containsString("<p>You must: ${requiredActionsText}</p>"));
    assertThat(rendered, not(containsString("executeActionsBodyHtml")));
  }

  /** Text bodies have no layout to sit in, so the override is served as-is. */
  @Test
  void textOverride_isNotWrapped() throws Exception {
    when(delegate.getTemplate("html/template.ftl"))
        .thenReturn(fileUrl("html/template.ftl", "the shell"));
    attributes.put(templateKey("text/password-reset.ftl"), "my text content");

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);

    assertThat(read(overlay.getTemplate("text/password-reset.ftl")), is("my text content"));
  }

  /** Legacy mustache bodies are whole documents; wrapping one would nest it in a layout. */
  @Test
  void mustacheOverride_isNotWrapped() throws Exception {
    attributes.put(templateKey("html/password-reset.mustache"), "<html><body>legacy</body></html>");

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);
    String rendered = read(overlay.getTemplate("html/password-reset.mustache"));

    assertThat(rendered, is("<html><body>legacy</body></html>"));
    assertThat(rendered, not(containsString("layout.emailLayout")));
  }

  /** A theme with no layout of its own gets the override verbatim. */
  @Test
  void htmlOverrideWithoutAThemeLayout_isNotWrapped() throws Exception {
    when(delegate.getTemplate("html/template.ftl")).thenReturn(null);
    attributes.put(templateKey("html/password-reset.ftl"), "<p>my content</p>");

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);

    assertThat(read(overlay.getTemplate("html/password-reset.ftl")), is("<p>my content</p>"));
  }

  /** An override that opts into the layout itself must not be wrapped twice. */
  @Test
  void htmlOverrideThatAlreadyImportsTheLayout_isNotWrappedAgain() throws Exception {
    when(delegate.getTemplate("html/template.ftl"))
        .thenReturn(fileUrl("html/template.ftl", "the shell"));
    String own =
        "<#import \"template.ftl\" as layout>\n<@layout.emailLayout>mine</@layout.emailLayout>";
    attributes.put(templateKey("html/password-reset.ftl"), own);

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);

    assertThat(read(overlay.getTemplate("html/password-reset.ftl")), is(own));
  }

  /** An edited override must not keep serving the previous content. */
  @Test
  void editedOverride_isServedFresh() throws Exception {
    when(delegate.getTemplate("html/template.ftl")).thenReturn(null);
    attributes.put(templateKey("html/password-reset.ftl"), "first");

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);
    assertThat(read(overlay.getTemplate("html/password-reset.ftl")), is("first"));

    attributes.put(templateKey("html/password-reset.ftl"), "second");
    assertThat(read(overlay.getTemplate("html/password-reset.ftl")), is("second"));
  }

  /**
   * The FreeMarker path reads messages through getEnhancedMessages, so the attribute overrides must
   * be applied there too -- and Keycloak's own realm localization must still win over them, as it
   * does on the mustache path.
   */
  @Test
  void attributeMessageOverrides_applyToEnhancedMessagesUnderRealmLocalization() throws Exception {
    RealmModel realm = mock(RealmModel.class);
    Properties inherited = new Properties();
    inherited.setProperty("packagedKey", "from the theme");
    inherited.setProperty("bothKey", "from the theme");
    when(delegate.getEnhancedMessages(realm, Locale.ENGLISH)).thenReturn(inherited);
    when(realm.getRealmLocalizationTextsByLocale("en"))
        .thenReturn(Map.of("bothKey", "from the realm"));

    attributes.put(EMAIL_MESSAGE_ATTRIBUTE_PREFIX + ".attributeKey", "from the attribute");
    attributes.put(EMAIL_MESSAGE_ATTRIBUTE_PREFIX + ".bothKey", "from the attribute");

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);
    Properties messages = overlay.getEnhancedMessages(realm, Locale.ENGLISH);

    assertThat(messages.getProperty("packagedKey"), is("from the theme"));
    assertThat(messages.getProperty("attributeKey"), is("from the attribute"));
    assertThat(messages.getProperty("bothKey"), is("from the realm"));
  }

  @Test
  void missingTemplateWithNoOverride_staysMissing() throws Exception {
    when(delegate.getTemplate("html/nope.ftl")).thenReturn(null);

    Theme overlay = AttributeOverlayTheme.wrap(session, delegate);

    assertThat(overlay.getTemplate("html/nope.ftl"), is(nullValue()));
  }
}
