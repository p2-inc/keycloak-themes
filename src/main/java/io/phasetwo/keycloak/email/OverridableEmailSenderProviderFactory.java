package io.phasetwo.keycloak.email;

import com.google.auto.service.AutoService;
import com.google.common.base.Strings;
import com.google.common.collect.ImmutableMap;
import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.Config;
import org.keycloak.email.DefaultEmailSenderProviderFactory;
import org.keycloak.email.EmailSenderProviderFactory;
import org.keycloak.models.KeycloakSession;

@JBossLog
@AutoService(EmailSenderProviderFactory.class)
public class OverridableEmailSenderProviderFactory extends DefaultEmailSenderProviderFactory {

  private Integer maxEmails;
  private Map<String, String> conf;
  private final LocalEmailCounter localCounter = new LocalEmailCounter();
  private volatile EmailCounter counter;

  @Override
  public OverridableEmailSenderProvider create(KeycloakSession session) {
    return new OverridableEmailSenderProvider(
        session, getEmailAuthenticators(), conf, maxEmails, counter(session));
  }

  /**
   * The counter behind the {@code maxEmails} limit, resolved on first use: the shared {@value
   * InfinispanEmailCounter#CACHE_NAME} Infinispan cache, defined here if the Infinispan
   * configuration does not declare it. If that cannot be had, the limit is still enforced, per
   * node, and a single WARN says so.
   */
  EmailCounter counter(KeycloakSession session) {
    EmailCounter c = counter;
    if (c == null) {
      synchronized (this) {
        c = counter;
        if (c == null) {
          c = resolveCounter(session);
          counter = c;
        }
      }
    }
    return c;
  }

  private EmailCounter resolveCounter(KeycloakSession session) {
    try {
      return new FallbackEmailCounter(InfinispanEmailCounter.create(session), localCounter);
    } catch (Exception e) {
      log.warnf(
          e,
          "Could not get the %s Infinispan cache; the limit of %d emails per realm per day is"
              + " enforced per node instead of per cluster.",
          InfinispanEmailCounter.CACHE_NAME,
          maxEmails);
      return localCounter;
    }
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
    super.init(config);
    log.info("Initializing config for email sender.");
    this.maxEmails = config.getInt("maxEmails", 100);
    log.infof("maxEmails set to %d", this.maxEmails);
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
  public String getId() {
    return "ext-email-override";
  }
}
