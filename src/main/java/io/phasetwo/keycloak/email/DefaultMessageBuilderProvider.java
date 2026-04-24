package io.phasetwo.keycloak.email;

import com.google.common.base.Strings;
import jakarta.activation.DataHandler;
import jakarta.activation.DataSource;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.util.ByteArrayDataSource;
import java.io.InputStream;
import java.util.Base64;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.email.EmailException;
import org.keycloak.models.KeycloakSession;

@JBossLog
public class DefaultMessageBuilderProvider implements MessageBuilderProvider {

  static final String LOGO_BASE64_ATTRIBUTE = "_providerConfig.assets.logo.base64";

  private static final String DEFAULT_LOGO_RESOURCE = "email/phasetwo-logo.svg";
  private static final String DEFAULT_LOGO_MIME = "image/svg+xml";

  protected final KeycloakSession session;

  public DefaultMessageBuilderProvider(KeycloakSession session) {
    this.session = session;
  }

  @Override
  public void updateMessage(Message message, Multipart multipart) throws EmailException {
    String dataUri = session.getContext().getRealm().getAttribute(LOGO_BASE64_ATTRIBUTE);

    if (Strings.isNullOrEmpty(dataUri)) {
      dataUri = loadDefaultLogoDataUri();
    }

    if (!Strings.isNullOrEmpty(dataUri)) {
      try {
        // CID inline images require multipart/related wrapping multipart/alternative.
        // Replace the message content: related { alternative { text, html }, image }
        MimeBodyPart altWrapper = new MimeBodyPart();
        altWrapper.setContent(multipart);

        MimeMultipart related = new MimeMultipart("related");
        related.addBodyPart(altWrapper);
        related.addBodyPart(buildInlinePart("logoLight", dataUri));

        message.setContent(related);
        message.saveChanges();

        log.debugf(
            "Attached logoLight CID part for realm %s",
            session.getContext().getRealm().getName());
      } catch (MessagingException e) {
        log.warn("Error restructuring email for logo attachment", e);
      } catch (Exception e) {
        log.warn("Error attaching email logo", e);
      }
    }
  }

  private String loadDefaultLogoDataUri() {
    try (InputStream is =
        getClass().getClassLoader().getResourceAsStream(DEFAULT_LOGO_RESOURCE)) {
      if (is == null) {
        log.warnf("Default email logo resource not found: %s", DEFAULT_LOGO_RESOURCE);
        return null;
      }
      byte[] bytes = is.readAllBytes();
      return "data:" + DEFAULT_LOGO_MIME + ";base64," + Base64.getEncoder().encodeToString(bytes);
    } catch (Exception e) {
      log.warn("Could not load default email logo", e);
      return null;
    }
  }

  private MimeBodyPart buildInlinePart(String contentId, String dataUri) throws Exception {
    String[] parts = dataUri.split(",", 2);
    if (parts.length != 2 || !parts[0].startsWith("data:") || !parts[0].contains(";base64")) {
      throw new IllegalArgumentException("Invalid data URI for contentId: " + contentId);
    }
    String mimeType = parts[0].substring(5, parts[0].indexOf(";"));
    byte[] bytes = Base64.getDecoder().decode(parts[1]);
    DataSource ds = new ByteArrayDataSource(bytes, mimeType);
    MimeBodyPart part = new MimeBodyPart();
    part.setDataHandler(new DataHandler(ds));
    part.setHeader("Content-ID", "<" + contentId + ">");
    part.setFileName(contentId);
    part.setDisposition(Part.INLINE);
    return part;
  }

  @Override
  public void close() {}
}
