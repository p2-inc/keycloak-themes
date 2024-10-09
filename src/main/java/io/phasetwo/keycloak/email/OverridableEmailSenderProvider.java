package io.phasetwo.keycloak.email;

import java.util.Map;
import org.keycloak.email.DefaultEmailSenderProvider;
import org.keycloak.email.EmailException;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.UserModel;

public class OverridableEmailSenderProvider extends DefaultEmailSenderProvider {

  private final KeycloakSession session;
  private final Map<String, String> conf;

  public OverridableEmailSenderProvider(KeycloakSession session, Map<String, String> conf) {
    super(session);
    this.session = session;
    this.conf = conf;
  }

  public boolean useOverride(Map<String, String> config) {
    return (!config.isEmpty() && config.containsKey("host"));
  }

  @Override
  public void send(
      Map<String, String> config, UserModel user, String subject, String textBody, String htmlBody)
      throws EmailException {
    if (useOverride(config)) {
      super.send(config, user, subject, textBody, htmlBody);
    } else {
      super.send(conf, user, subject, textBody, htmlBody);
    }
  }

  @Override
  public void send(
      Map<String, String> config, String address, String subject, String textBody, String htmlBody)
      throws EmailException {
    if (useOverride(config)) {
      super.send(config, address, subject, textBody, htmlBody);
    } else {
      super.send(conf, address, subject, textBody, htmlBody);
    }
  }
}
