package io.phasetwo.keycloak.email;

import com.google.auto.service.AutoService;
import com.google.common.base.Strings;
import com.google.common.collect.ImmutableMap;
import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.Config;
import org.keycloak.email.EmailSenderProviderFactory;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;

@JBossLog
@AutoService(EmailSenderProviderFactory.class)
public class OverridableEmailSenderProviderFactory implements EmailSenderProviderFactory {

  private Map<String, String> conf;

  @Override
  public OverridableEmailSenderProvider create(KeycloakSession session) {
    return new OverridableEmailSenderProvider(session, conf);
  }

  public static final String[] PROPERTY_NAMES = {
    "host",
    "auth",
    "ssl",
    "starttls",
    "port",
    "from",
    "fromDisplayName",
    "replyTo",
    "replyToDisplayName",
    "envelopeFrom",
    "user",
    "password"
  };

  @Override
  public void init(Config.Scope config) {
    log.info("Initializing config for email sender.");

    String host = config.get("host");
    if (!Strings.isNullOrEmpty(host)) { // TODO better test than this
      ImmutableMap.Builder<String, String> builder = ImmutableMap.builder();
      for (String name : PROPERTY_NAMES) {
        String v = config.get(name);
        if (v != null) {
          builder.put(name, v);
        }
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
    return "ext-email-override";
  }
}
