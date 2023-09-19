package io.phasetwo.keycloak.themes.resource;

import com.google.auto.service.AutoService;
import io.phasetwo.keycloak.ext.util.Stats;
import io.phasetwo.keycloak.themes.Version;
import org.keycloak.Config.Scope;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.services.resource.RealmResourceProviderFactory;

@AutoService(RealmResourceProviderFactory.class)
public class EmailsResourceProviderFactory implements RealmResourceProviderFactory {

  public static final String ID = "emails";

  @Override
  public String getId() {
    return ID;
  }

  @Override
  public RealmResourceProvider create(KeycloakSession session) {
    return new EmailsResourceProvider(session);
  }

  @Override
  public void init(Scope config) {
    Stats.collect(Version.getName(), Version.getVersion(), Version.getCommit());
  }

  @Override
  public void postInit(KeycloakSessionFactory factory) {}

  @Override
  public void close() {}
}
