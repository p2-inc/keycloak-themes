package io.phasetwo.keycloak.email;

import java.util.List;
import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.email.EmailException;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

@JBossLog
public class DefaultAttributesBuilderProvider implements AttributesBuilderProvider {

  protected final KeycloakSession session;

  public DefaultAttributesBuilderProvider(KeycloakSession session) {
    this.session = session;
  }

  @Override
  public void updateAttributes(
      RealmModel realm, List<Object> subjectAttributes, Map<String, Object> bodyAttributes)
      throws EmailException {
    log.debugf("update attributes no-op");
  }

  @Override
  public void close() {}
}
