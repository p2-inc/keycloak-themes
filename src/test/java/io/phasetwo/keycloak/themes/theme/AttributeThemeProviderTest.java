package io.phasetwo.keycloak.themes.theme;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RealmProvider;
import org.keycloak.theme.Theme;

/**
 * Keycloak constructs every registered ThemeProvider on each theme resolution and only then asks
 * whether it has the theme. This provider serves EMAIL only, so it must not allocate anything until
 * it actually serves something -- otherwise every login and account render leaks a uniquely-named
 * scratch directory into the kernel's dentry cache.
 */
class AttributeThemeProviderTest {

  private static final String REALM = "test-realm";

  private final Map<String, String> attributes = new HashMap<>();
  private KeycloakSession session;

  @BeforeEach
  void setUp() {
    RealmModel realm = mock(RealmModel.class);
    when(realm.getAttributes()).thenReturn(attributes);
    when(realm.getName()).thenReturn(REALM);

    RealmProvider realms = mock(RealmProvider.class);
    when(realms.getRealmByName(REALM)).thenReturn(realm);

    KeycloakContext context = mock(KeycloakContext.class);
    when(context.getRealm()).thenReturn(realm);

    session = mock(KeycloakSession.class);
    when(session.realms()).thenReturn(realms);
    when(session.getContext()).thenReturn(context);
  }

  /** Reads the private field directly: "was anything allocated yet" is the whole contract here. */
  private static File tmpDirField(AttributeThemeProvider provider) throws Exception {
    Field f = AttributeThemeProvider.class.getDeclaredField("tmpdir");
    f.setAccessible(true);
    return (File) f.get(provider);
  }

  @Test
  void constructionAllocatesNothing() throws Exception {
    AttributeThemeProvider provider = new AttributeThemeProvider(session);
    assertThat(tmpDirField(provider), is(nullValue()));
  }

  @ParameterizedTest
  @EnumSource(
      value = Theme.Type.class,
      names = {"LOGIN", "ACCOUNT", "ADMIN", "WELCOME"})
  void nonEmailTypesAreNotServedAndAllocateNothing(Theme.Type type) throws Exception {
    AttributeThemeProvider provider = new AttributeThemeProvider(session);

    assertThat(provider.hasTheme(AttributeThemeProvider.ATTRIBUTE_THEME_NAME, type), is(false));
    assertThat(
        provider.getTheme(AttributeThemeProvider.ATTRIBUTE_THEME_NAME, type), is(nullValue()));
    assertThat(tmpDirField(provider), is(nullValue()));
  }

  @Test
  void unknownEmailThemeNameIsNotServedAndAllocatesNothing() throws Exception {
    AttributeThemeProvider provider = new AttributeThemeProvider(session);

    assertThat(provider.getTheme("some-other-theme", Theme.Type.EMAIL), is(nullValue()));
    assertThat(tmpDirField(provider), is(nullValue()));
  }

  /** Both legacy names still resolve, and only then is the scratch directory created. */
  @ParameterizedTest
  @EnumSource(
      value = LegacyName.class,
      names = {"ATTRIBUTES", "ATTRIBUTES_V2"})
  void legacyEmailThemesAreServedAndAllocateOnDemand(LegacyName legacy) throws Exception {
    AttributeThemeProvider provider = new AttributeThemeProvider(session);

    Theme theme = provider.getTheme(legacy.themeName, Theme.Type.EMAIL);

    assertThat(theme, is(notNullValue()));
    assertThat(theme.getType(), is(Theme.Type.EMAIL));
    File tmpdir = tmpDirField(provider);
    assertThat(tmpdir, is(notNullValue()));
    assertThat(tmpdir.isDirectory(), is(true));

    provider.close();
  }

  enum LegacyName {
    ATTRIBUTES("attributes"),
    ATTRIBUTES_V2("attributes-v2");

    final String themeName;

    LegacyName(String themeName) {
      this.themeName = themeName;
    }
  }

  /** The directory is created once and reused, not re-created per served theme. */
  @Test
  void tmpDirIsCreatedOnceAndReused() throws Exception {
    AttributeThemeProvider provider = new AttributeThemeProvider(session);

    provider.getTheme(AttributeThemeProvider.ATTRIBUTE_THEME_NAME, Theme.Type.EMAIL);
    File first = tmpDirField(provider);
    provider.getTheme(AttributeThemeProvider.ATTRIBUTE_THEME_NAME, Theme.Type.EMAIL);
    File second = tmpDirField(provider);

    assertThat(second, is(first));
    provider.close();
  }

  /** Regression: close() used to NPE when nothing had been served. */
  @Test
  void closeIsSafeWhenNothingWasServed() {
    AttributeThemeProvider provider = new AttributeThemeProvider(session);
    provider.close();
  }

  @Test
  void closeRemovesTheDirectoryThatWasCreated() throws IOException, Exception {
    AttributeThemeProvider provider = new AttributeThemeProvider(session);
    provider.getTheme(AttributeThemeProvider.ATTRIBUTE_THEME_NAME, Theme.Type.EMAIL);
    File tmpdir = tmpDirField(provider);
    assertThat(tmpdir.exists(), is(true));

    provider.close();

    assertThat(tmpdir.exists(), is(false));
  }
}
