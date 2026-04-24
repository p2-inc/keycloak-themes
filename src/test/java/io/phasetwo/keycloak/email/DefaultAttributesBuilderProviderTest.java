package io.phasetwo.keycloak.email;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

public class DefaultAttributesBuilderProviderTest {

  private KeycloakSession kcSession;
  private RealmModel realm;
  private DefaultAttributesBuilderProvider provider;

  @BeforeEach
  void setUp() {
    kcSession = mock(KeycloakSession.class);
    realm = mock(RealmModel.class);
    provider = new DefaultAttributesBuilderProvider(kcSession);
  }

  @Test
  void updateAttributes_withAllBrandingSet_injectsBrandingMap() throws Exception {
    when(realm.getAttribute(DefaultMessageBuilderProvider.LOGO_BASE64_ATTRIBUTE))
        .thenReturn("data:image/png;base64,abc123");
    when(realm.getAttribute(DefaultAttributesBuilderProvider.FOOTER_LINE1_ATTRIBUTE))
        .thenReturn("Acme Corp");
    when(realm.getAttribute(DefaultAttributesBuilderProvider.FOOTER_LINE2_ATTRIBUTE))
        .thenReturn("contact@acme.com");
    when(realm.getName()).thenReturn("test-realm");

    Map<String, Object> bodyAttributes = new HashMap<>();
    provider.updateAttributes(realm, new ArrayList<>(), bodyAttributes);

    assertThat(bodyAttributes, hasKey("branding"));
    @SuppressWarnings("unchecked")
    Map<String, Object> branding = (Map<String, Object>) bodyAttributes.get("branding");
    assertThat(branding.get("logoLight"), is("data:image/png;base64,abc123"));
    assertThat(branding.get("footerLine1"), is("Acme Corp"));
    assertThat(branding.get("footerLine2"), is("contact@acme.com"));
  }

  @Test
  void updateAttributes_withNoBrandingSet_doesNotInjectBrandingMap() throws Exception {
    when(realm.getAttribute(anyString())).thenReturn(null);
    when(realm.getName()).thenReturn("test-realm");

    Map<String, Object> bodyAttributes = new HashMap<>();
    provider.updateAttributes(realm, new ArrayList<>(), bodyAttributes);

    assertThat(bodyAttributes, not(hasKey("branding")));
  }

  @Test
  void updateAttributes_withPartialBranding_injectsOnlyPresentValues() throws Exception {
    when(realm.getAttribute(DefaultMessageBuilderProvider.LOGO_BASE64_ATTRIBUTE)).thenReturn(null);
    when(realm.getAttribute(DefaultAttributesBuilderProvider.FOOTER_LINE1_ATTRIBUTE))
        .thenReturn("Acme Corp");
    when(realm.getAttribute(DefaultAttributesBuilderProvider.FOOTER_LINE2_ATTRIBUTE))
        .thenReturn(null);
    when(realm.getName()).thenReturn("test-realm");

    Map<String, Object> bodyAttributes = new HashMap<>();
    provider.updateAttributes(realm, new ArrayList<>(), bodyAttributes);

    assertThat(bodyAttributes, hasKey("branding"));
    @SuppressWarnings("unchecked")
    Map<String, Object> branding = (Map<String, Object>) bodyAttributes.get("branding");
    assertThat(branding, not(hasKey("logoLight")));
    assertThat(branding.get("footerLine1"), is("Acme Corp"));
    assertThat(branding, not(hasKey("footerLine2")));
  }

  @Test
  void updateAttributes_withEmptyStringAttributes_treatsAsAbsent() throws Exception {
    when(realm.getAttribute(DefaultMessageBuilderProvider.LOGO_BASE64_ATTRIBUTE)).thenReturn("");
    when(realm.getAttribute(DefaultAttributesBuilderProvider.FOOTER_LINE1_ATTRIBUTE))
        .thenReturn("");
    when(realm.getAttribute(DefaultAttributesBuilderProvider.FOOTER_LINE2_ATTRIBUTE))
        .thenReturn("");
    when(realm.getName()).thenReturn("test-realm");

    Map<String, Object> bodyAttributes = new HashMap<>();
    provider.updateAttributes(realm, new ArrayList<>(), bodyAttributes);

    assertThat(bodyAttributes, not(hasKey("branding")));
  }
}
