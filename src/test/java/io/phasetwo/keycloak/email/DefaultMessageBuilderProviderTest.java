package io.phasetwo.keycloak.email;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;

import jakarta.mail.Part;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import java.util.Base64;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

public class DefaultMessageBuilderProviderTest {

  // Minimal valid SVG as a data URI
  private static final String TEST_DATA_URI =
      "data:image/svg+xml;base64,"
          + Base64.getEncoder()
              .encodeToString("<svg xmlns=\"http://www.w3.org/2000/svg\"/>".getBytes());

  private KeycloakSession kcSession;
  private RealmModel realm;
  private jakarta.mail.Session mailSession;

  @BeforeEach
  void setUp() {
    kcSession = mock(KeycloakSession.class);
    KeycloakContext context = mock(KeycloakContext.class);
    realm = mock(RealmModel.class);
    when(kcSession.getContext()).thenReturn(context);
    when(context.getRealm()).thenReturn(realm);
    mailSession = jakarta.mail.Session.getInstance(new Properties());
  }

  private MimeMultipart buildAlternative() throws Exception {
    MimeMultipart alt = new MimeMultipart("alternative");
    MimeBodyPart text = new MimeBodyPart();
    text.setText("Hello", "UTF-8");
    alt.addBodyPart(text);
    MimeBodyPart html = new MimeBodyPart();
    html.setContent("<p>Hello</p>", "text/html; charset=UTF-8");
    alt.addBodyPart(html);
    return alt;
  }

  @Test
  void updateMessage_withRealmLogo_restructuresToRelatedAndAttachesLogo() throws Exception {
    when(realm.getAttribute(DefaultMessageBuilderProvider.LOGO_BASE64_ATTRIBUTE))
        .thenReturn(TEST_DATA_URI);
    when(realm.getName()).thenReturn("test-realm");

    MimeMultipart alternative = buildAlternative();
    MimeMessage message = new MimeMessage(mailSession);
    message.setContent(alternative);
    message.saveChanges();

    new DefaultMessageBuilderProvider(kcSession).updateMessage(message, alternative);

    MimeMultipart related = (MimeMultipart) message.getContent();
    assertThat(related.getContentType(), containsString("related"));
    assertThat(related.getCount(), is(2));

    // first part wraps the original alternative
    MimeBodyPart altWrapper = (MimeBodyPart) related.getBodyPart(0);
    MimeMultipart altContent = (MimeMultipart) altWrapper.getContent();
    assertThat(altContent.getContentType(), containsString("alternative"));
    assertThat(altContent.getCount(), is(2));

    // second part is the inline logo
    MimeBodyPart logoPart = (MimeBodyPart) related.getBodyPart(1);
    assertThat(logoPart.getHeader("Content-ID")[0], is("<logoLight>"));
    assertThat(logoPart.getDisposition(), is(Part.INLINE));
    assertThat(logoPart.getContentType(), containsString("image/svg+xml"));
  }

  @Test
  void updateMessage_withNoRealmLogo_fallsBackToDefaultPhaseTwoLogo() throws Exception {
    when(realm.getAttribute(DefaultMessageBuilderProvider.LOGO_BASE64_ATTRIBUTE)).thenReturn(null);
    when(realm.getName()).thenReturn("test-realm");

    MimeMultipart alternative = buildAlternative();
    MimeMessage message = new MimeMessage(mailSession);
    message.setContent(alternative);
    message.saveChanges();

    new DefaultMessageBuilderProvider(kcSession).updateMessage(message, alternative);

    // should still restructure — default logo was loaded from classpath
    MimeMultipart related = (MimeMultipart) message.getContent();
    assertThat(related.getContentType(), containsString("related"));
    assertThat(related.getCount(), is(2));

    MimeBodyPart logoPart = (MimeBodyPart) related.getBodyPart(1);
    assertThat(logoPart.getHeader("Content-ID")[0], is("<logoLight>"));
    assertThat(logoPart.getContentType(), containsString("image/svg+xml"));
  }

  @Test
  void updateMessage_withInvalidDataUri_keepsOriginalStructure() throws Exception {
    when(realm.getAttribute(DefaultMessageBuilderProvider.LOGO_BASE64_ATTRIBUTE))
        .thenReturn("not-a-valid-data-uri");
    when(realm.getName()).thenReturn("test-realm");

    MimeMultipart alternative = buildAlternative();
    MimeMessage message = new MimeMessage(mailSession);
    message.setContent(alternative);
    message.saveChanges();

    // should not throw; invalid URI is caught internally
    new DefaultMessageBuilderProvider(kcSession).updateMessage(message, alternative);

    // original structure is preserved since attachment failed
    Object content = message.getContent();
    assertThat(content, instanceOf(MimeMultipart.class));
    assertThat(((MimeMultipart) content).getContentType(), containsString("alternative"));
  }
}
