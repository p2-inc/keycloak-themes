package io.phasetwo.keycloak.email;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * An {@link EmailCounter} that lives in this node's memory only. It is the fallback when no
 * Infinispan cache can be obtained: the limit then applies per node, so a cluster of N nodes lets
 * a realm send up to N times {@code maxEmails} a day, which is still a limit.
 *
 * <p>Keys carry the day, so a key from an earlier day is never read again. The map is cleared of
 * them whenever a key it has not seen before arrives, which keeps it to one entry per realm.
 */
public class LocalEmailCounter implements EmailCounter {

  private final ConcurrentMap<String, AtomicInteger> counts = new ConcurrentHashMap<>();
  private volatile String lastDay;

  @Override
  public int increment(String key) {
    AtomicInteger count = counts.get(key);
    if (count == null) {
      pruneOtherDays(key);
      count = counts.computeIfAbsent(key, k -> new AtomicInteger());
    }
    return count.incrementAndGet();
  }

  private void pruneOtherDays(String key) {
    String day = day(key);
    if (day.equals(lastDay)) return;
    lastDay = day;
    counts.keySet().removeIf(k -> !day(k).equals(day));
  }

  /** Keys end with the day, {@code yyyy-MM-dd}; see {@link OverridableEmailSenderProvider}. */
  private static String day(String key) {
    return key.length() < 10 ? key : key.substring(key.length() - 10);
  }

  int size() {
    return counts.size();
  }
}
