package io.phasetwo.keycloak.email;

import com.google.auto.service.AutoService;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.Config.Scope;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;

@JBossLog
@AutoService(MessageBuilderProviderFactory.class)
public class DefaultMessageBuilderProviderFactory implements MessageBuilderProviderFactory {

  public static final String PROVIDER_ID = "default";

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public MessageBuilderProvider create(KeycloakSession session) {
    return new DefaultMessageBuilderProvider(session);
  }

  @Override
  public void init(Scope config) {}

  @Override
  public void postInit(KeycloakSessionFactory factory) {}

  @Override
  public void close() {}
}
