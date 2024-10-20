package io.phasetwo.keycloak.email;

import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.infinispan.Cache;
import org.keycloak.connections.infinispan.InfinispanConnectionProvider;
import org.keycloak.email.DefaultEmailSenderProvider;
import org.keycloak.email.EmailException;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.UserModel;

@JBossLog
public class OverridableEmailSenderProvider extends DefaultEmailSenderProvider {

  private final KeycloakSession session;
  private final Map<String, String> conf;
  private final Integer maxEmails;
  private final Cache<String, Integer> counterCache;

  public OverridableEmailSenderProvider(
      KeycloakSession session, Map<String, String> conf, Integer maxEmails) {
    super(session);
    this.session = session;
    this.conf = conf;
    this.maxEmails = maxEmails;
    this.counterCache =
        session.getProvider(InfinispanConnectionProvider.class).getCache("counterCache", true);
  }

  private boolean useOverride(Map<String, String> config) {
    return (!config.isEmpty() && config.containsKey("host"));
  }

  private String getCacheKey() {
    if (session.getContext().getRealm() != null) {
      return String.format(
          "ext-email-override-emailCounter-%s", session.getContext().getRealm().getName());
    } else {
      return null;
    }
  }

  private boolean canSend() {
    String cacheKey = getCacheKey();
    if (cacheKey == null) return true;
    Integer count = counterCache.get(cacheKey);
    if (count == null || count <= maxEmails) return true;
    else return false;
  }

  private Integer increment() {
    String cacheKey = getCacheKey();
    if (cacheKey == null) return 0;
    else return counterCache.compute(cacheKey, (key, value) -> (value == null) ? 1 : value + 1);
  }

  @Override
  public void send(
      Map<String, String> config, UserModel user, String subject, String textBody, String htmlBody)
      throws EmailException {
    if (useOverride(config)) {
      log.debug("Using customer override email sender");
      super.send(config, user, subject, textBody, htmlBody);
    } else {
      if (canSend()) {
        super.send(conf, user, subject, textBody, htmlBody);
        Integer count = increment();
        log.infof("Email count %d for %s", count, getCacheKey());
      } else {
        log.infof("Unable to send email for limit %d %s", maxEmails, getCacheKey());
      }
    }
  }

  @Override
  public void send(
      Map<String, String> config, String address, String subject, String textBody, String htmlBody)
      throws EmailException {
    if (useOverride(config)) {
      log.debug("Using customer override email sender");
      super.send(config, address, subject, textBody, htmlBody);
    } else {
      if (canSend()) {
        super.send(conf, address, subject, textBody, htmlBody);
        Integer count = increment();
        log.infof("Email count %d for %s", count, getCacheKey());
      } else {
        log.infof("Unable to send email for limit %d %s", maxEmails, getCacheKey());
      }
    }
  }
}
