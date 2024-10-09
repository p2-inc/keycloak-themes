package io.phasetwo.keycloak.email;

import com.google.common.base.Strings;
import com.google.common.collect.ImmutableMap;
import java.util.Map;
import org.keycloak.Config;
import org.keycloak.email.EmailSenderProviderFactory;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;

public class OverridableEmailSenderProviderFactory implements EmailSenderProviderFactory {

  private Map<String, String> conf;

  @Override
  public OverridableEmailSenderProvider create(KeycloakSession session) {
    return new OverridableEmailSenderProvider(session, conf);
  }

  /**
   * Config should contain: - host - auth - ssl - port - from - fromDisplayName - replyTo -
   * replyToDisplayName - envelopeFrom - user - password
   */
  @Override
  public void init(Config.Scope config) {
    String host = config.get("host");
    if (!Strings.isNullOrEmpty(host)) {
      ImmutableMap.Builder<String, String> builder = ImmutableMap.builder();
      for (String name : config.getPropertyNames()) {
        builder.put(name, config.get(name));
      }
      this.conf = builder.build();
    } else {
      this.conf = ImmutableMap.of();
    }
  }

  @Override
  public void postInit(KeycloakSessionFactory factory) {}

  @Override
  public void close() {}

  @Override
  public String getId() {
    return "default";
  }
}
