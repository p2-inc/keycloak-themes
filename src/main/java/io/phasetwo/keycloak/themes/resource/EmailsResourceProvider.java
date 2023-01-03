package io.phasetwo.keycloak.themes.resource;

import javax.ws.rs.*;
import lombok.extern.jbosslog.JBossLog;
import org.jboss.resteasy.spi.ResteasyProviderFactory;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

@JBossLog
public class EmailsResourceProvider extends BaseRealmResourceProvider {

  public EmailsResourceProvider(KeycloakSession session) {
    super(session);
  }

  @Override
  public Object getRealmResource() {
    RealmModel realm = session.getContext().getRealm();
    EmailsResource emails = new EmailsResource(realm, session);
    ResteasyProviderFactory.getInstance().injectProperties(emails);
    emails.setup();
    return emails;
  }
}
