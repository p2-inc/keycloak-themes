package io.phasetwo.keycloak.email;

import java.util.List;
import java.util.Map;
import org.keycloak.email.EmailException;
import org.keycloak.models.RealmModel;
import org.keycloak.provider.Provider;

public interface AttributesBuilderProvider extends Provider {

  void updateAttributes(
      RealmModel realm, List<Object> subjectAttributes, Map<String, Object> bodyAttributes)
      throws EmailException;
}
