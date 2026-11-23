package io.phasetwo.keycloak.email;

import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.jbosslog.JBossLog;

/**
 * Counts with {@code primary}, and with {@code fallback} for any increment where {@code primary}
 * throws, so that a failing cache never lets an email through uncounted. The first failure is
 * logged at WARN; later ones at DEBUG, so a flood of sends does not become a flood of warnings.
 */
@JBossLog
public class FallbackEmailCounter implements EmailCounter {

  private final EmailCounter primary;
  private final EmailCounter fallback;
  private final AtomicBoolean warned = new AtomicBoolean();

  public FallbackEmailCounter(EmailCounter primary, EmailCounter fallback) {
    this.primary = primary;
    this.fallback = fallback;
  }

  @Override
  public int increment(String key) {
    try {
      return primary.increment(key);
    } catch (RuntimeException e) {
      if (warned.compareAndSet(false, true)) {
        log.warnf(
            e,
            "Email counter failed; counting on this node only, so the email limit applies per node."
                + " Further failures are logged at DEBUG.");
      } else {
        log.debugf("Email counter failed for %s: %s", key, e.getMessage());
      }
      return fallback.increment(key);
    }
  }
}
