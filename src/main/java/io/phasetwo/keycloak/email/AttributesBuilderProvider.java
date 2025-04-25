package io.phasetwo.keycloak.email;

import java.util.List;
import java.util.Map;
import org.keycloak.email.EmailException;
import org.keycloak.provider.Provider;

public interface AttributesBuilderProvider extends Provider {

  void updateAttributes(List<Object> subjectAttributes, Map<String, Object> bodyAttributes)
      throws EmailException;
}
