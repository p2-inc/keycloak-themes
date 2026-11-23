package io.phasetwo.keycloak.email;

/**
 * Counts the emails a realm has sent through the global SMTP configuration of {@link
 * OverridableEmailSenderProviderFactory}, so that the daily {@code maxEmails} limit can be
 * enforced.
 */
public interface EmailCounter {

  /**
   * Atomically adds one to the counter for {@code key}.
   *
   * @param key the counter key, which already contains the realm and the day
   * @return the value of the counter after the increment
   */
  int increment(String key);
}
