package io.phasetwo.keycloak.themes.resource;

import com.google.common.collect.ImmutableMap;
import io.phasetwo.keycloak.themes.theme.MustacheProvider;
import java.io.IOException;
import java.util.Map;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.theme.Theme;
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
