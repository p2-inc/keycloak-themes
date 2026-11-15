package io.phasetwo.keycloak.themes.theme;

import static io.phasetwo.keycloak.themes.theme.AttributeTheme.templateKey;
import static io.phasetwo.keycloak.themes.theme.FreeMarkerAndMustacheEmailTemplateProvider.freeMarkerFor;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.sameInstance;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RealmProvider;
import org.keycloak.theme.KeycloakSanitizerMethod;
import org.keycloak.theme.Theme;
import org.keycloak.theme.freemarker.DefaultFreeMarkerProvider;
import org.keycloak.theme.freemarker.FreeMarkerProvider;

/**
 * Renders through Keycloak's own {@code DefaultFreeMarkerProvider} with its template cache on, as a
 * production server does, with two realms sharing one email theme.
 */
class EmailTemplateCacheIsolationTest {

  private static final String TEMPLATE = "html/email-verification.ftl";

  @TempDir Path tmp;

  private final Map<String, Map<String, String>> attributes = new HashMap<>();
  private final RealmProvider realms = mock(RealmProvider.class);
  private KeycloakSession current;
  private Theme delegate;
  private FreeMarkerProvider shared;

  @BeforeEach
  void setUp() throws Exception {
    Path packaged = tmp.resolve(TEMPLATE);
    Files.createDirectories(packaged.getParent());
    Files.writeString(packaged, "the packaged email");

    delegate = mock(Theme.class);
    when(delegate.getName()).thenReturn("keycloak");
    when(delegate.getType()).thenReturn(Theme.Type.EMAIL);
    when(delegate.getTemplate(TEMPLATE)).thenReturn(packaged.toUri().toURL());

    shared =
        new DefaultFreeMarkerProvider(new ConcurrentHashMap<>(), new KeycloakSanitizerMethod());
  }

  /** A request in {@code realmName}: the overlay reads the realm from whatever session is current. */
  private void requestIn(String realmName) {
    RealmModel realm = mock(RealmModel.class);
    when(realm.getName()).thenReturn(realmName);
    when(realm.getAttributes())
        .thenReturn(attributes.computeIfAbsent(realmName, k -> new HashMap<>()));
    when(realms.getRealmByName(realmName)).thenReturn(realm);

    KeycloakContext context = mock(KeycloakContext.class);
    when(context.getRealm()).thenReturn(realm);

    current = mock(KeycloakSession.class);
    when(current.realms()).thenReturn(realms);
    when(current.getContext()).thenReturn(context);
    when(current.getAttribute(anyString())).thenReturn(null);
  }

  private void override(String realmName, String body) {
    attributes.computeIfAbsent(realmName, k -> new HashMap<>()).put(templateKey(TEMPLATE), body);
  }

  /** Sends one email the way the provider does: a fresh overlay, and the provider chosen for it. */
  private String render(String realmName) throws Exception {
    requestIn(realmName);
    Theme theme = new AttributeOverlayTheme(() -> current, delegate);
    return freeMarkerFor(theme, shared).processTemplate(new HashMap<>(), TEMPLATE, theme);
  }

  @Test
  void overrideRealmSendsFirst_theOtherRealmStillGetsTheThemeEmail() throws Exception {
    override("realm-a", "realm A's override");

    assertThat(render("realm-a"), is("realm A's override"));
    assertThat(render("realm-b"), is("the packaged email"));
    assertThat(render("realm-a"), is("realm A's override"));
  }

  @Test
  void plainRealmSendsFirst_theOverrideRealmStillGetsItsOverride() throws Exception {
    override("realm-a", "realm A's override");

    assertThat(render("realm-b"), is("the packaged email"));
    assertThat(render("realm-a"), is("realm A's override"));
    assertThat(render("realm-b"), is("the packaged email"));
  }

  @Test
  void twoRealmsOverridingTheSameTemplate_eachGetTheirOwn() throws Exception {
    override("realm-a", "realm A's override");
    override("realm-b", "realm B's override");

    assertThat(render("realm-a"), is("realm A's override"));
    assertThat(render("realm-b"), is("realm B's override"));
  }

  @Test
  void anEditedOverride_isSentOnTheNextEmail() throws Exception {
    override("realm-a", "first version");
    assertThat(render("realm-a"), is("first version"));

    override("realm-a", "second version");
    assertThat(render("realm-a"), is("second version"));

    attributes.get("realm-a").clear();
    assertThat(render("realm-a"), is("the packaged email"));
  }

  @Test
  void aRealmWithoutTemplateOverrides_keepsTheSharedCachedProvider() throws Exception {
    requestIn("realm-b");
    attributes.get("realm-b").put(AttributeTheme.messageKey("emailVerificationSubject"), "Hi");
    Theme theme = new AttributeOverlayTheme(() -> current, delegate);

    assertThat(freeMarkerFor(theme, shared), is(sameInstance(shared)));
    assertThat(freeMarkerFor(delegate, shared), is(sameInstance(shared)));

    override("realm-b", "an override");
    assertThat(freeMarkerFor(theme, shared), is(not(sameInstance(shared))));
  }
}
