package io.phasetwo.keycloak.themes.resource;

import javax.ws.rs.*;
import lombok.extern.jbosslog.JBossLog;
import org.jboss.resteasy.spi.ResteasyProviderFactory;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.services.resource.RealmResourceProvider;

@JBossLog
public class EmailsResourceProvider implements RealmResourceProvider {

  private final KeycloakSession session;

  public EmailsResourceProvider(KeycloakSession session) {
    this.session = session;
  }

  @Override
  public Object getResource() {
    RealmModel realm = session.getContext().getRealm();
    EmailsResource emails = new EmailsResource(realm, session);
    ResteasyProviderFactory.getInstance().injectProperties(emails);
    emails.setup();
    return emails;
  }

  @Override
  public void close() {}
}
