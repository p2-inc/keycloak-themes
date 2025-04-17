package io.phasetwo.keycloak.email;

import jakarta.mail.Message;
import jakarta.mail.Multipart;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.email.EmailException;
import org.keycloak.models.KeycloakSession;

@JBossLog
public class DefaultMessageBuilderProvider implements MessageBuilderProvider {

  protected final KeycloakSession session;

  public DefaultMessageBuilderProvider(KeycloakSession session) {
    this.session = session;
  }

  @Override
  public void updateMessage(Message message, Multipart multipart) throws EmailException {
    log.debugf("update message no-op");
  }

  @Override
  public void close() {}
}
