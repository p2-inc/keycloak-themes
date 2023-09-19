package io.phasetwo.keycloak.themes.resource;

import io.phasetwo.keycloak.ext.resource.BaseRealmResourceProvider;
import jakarta.ws.rs.*;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;

@JBossLog
public class EmailsResourceProvider extends BaseRealmResourceProvider {

  public EmailsResourceProvider(KeycloakSession session) {
    super(session);
  }

  @Override
  public Object getRealmResource() {
    EmailsResource emails = new EmailsResource(session);
    emails.setup();
    return emails;
  }
}
