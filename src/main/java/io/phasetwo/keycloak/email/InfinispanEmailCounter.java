package io.phasetwo.keycloak.email;

import java.util.concurrent.TimeUnit;
import lombok.extern.jbosslog.JBossLog;
import org.infinispan.Cache;
import org.infinispan.commons.CacheConfigurationException;
import org.infinispan.configuration.cache.CacheMode;
import org.infinispan.configuration.cache.ConfigurationBuilder;
import org.infinispan.manager.EmbeddedCacheManager;
import org.keycloak.connections.infinispan.InfinispanConnectionProvider;
import org.keycloak.models.KeycloakSession;

/**
 * An {@link EmailCounter} kept in the {@value #CACHE_NAME} Infinispan cache, shared by every node
 * of the cluster.
 *
 * <p>The cache used to have to be declared in each deployment's Infinispan XML. Where it was not,
 * the limit was silently not enforced. {@link #create(KeycloakSession)} now defines it on
 * Keycloak's embedded cache manager when the XML does not: replicated and synchronous when the
 * cache manager is clustered, so that every node counts against the same number, and local
 * otherwise. A declaration in the XML still takes precedence.
 *
 * <p>Increments use {@code putIfAbsent} and {@code replace(key, old, new)} rather than {@code
 * compute}: on a clustered cache {@code compute} ships its function to the primary owner, and a
 * lambda cannot be marshalled with Keycloak's ProtoStream marshaller. The conditional writes only
 * carry the {@code String} key and {@code Integer} values.
 */
@JBossLog
public class InfinispanEmailCounter implements EmailCounter {

  public static final String CACHE_NAME = "counterCache";

  /** Entries outlive the day in their key by a margin, then expire. */
  static final long LIFESPAN_HOURS = 25;

  private static final int MAX_ATTEMPTS = 100;

  private final Cache<String, Integer> cache;

  InfinispanEmailCounter(Cache<String, Integer> cache) {
    this.cache = cache;
  }

  /**
   * Gets the {@value #CACHE_NAME} cache, defining it first if the Infinispan configuration does
   * not.
   *
   * @throws RuntimeException if Infinispan is unavailable or the cache cannot be started
   */
  public static InfinispanEmailCounter create(KeycloakSession session) {
    InfinispanConnectionProvider ispn = session.getProvider(InfinispanConnectionProvider.class);
    if (ispn == null) {
      throw new IllegalStateException("No InfinispanConnectionProvider");
    }
    // The work cache exists in every Keycloak configuration; it is only used to reach the
    // embedded cache manager that Keycloak built from its XML.
    EmbeddedCacheManager cacheManager =
        ispn.getCache(InfinispanConnectionProvider.WORK_CACHE_NAME).getCacheManager();
    defineIfAbsent(cacheManager);
    return new InfinispanEmailCounter(cacheManager.getCache(CACHE_NAME));
  }

  static void defineIfAbsent(EmbeddedCacheManager cacheManager) {
    if (cacheManager.getCacheConfiguration(CACHE_NAME) != null) {
      log.infof("Using the %s cache from the Infinispan configuration", CACHE_NAME);
      return;
    }
    boolean clustered = cacheManager.getCacheManagerConfiguration().isClustered();
    ConfigurationBuilder builder = new ConfigurationBuilder();
    builder.clustering().cacheMode(clustered ? CacheMode.REPL_SYNC : CacheMode.LOCAL);
    try {
      cacheManager.defineConfiguration(CACHE_NAME, builder.build());
      log.infof(
          "Defined the %s cache (%s), which the Infinispan configuration does not declare",
          CACHE_NAME, clustered ? "replicated" : "local");
    } catch (CacheConfigurationException e) {
      // Another thread defined it first.
      log.debugf("%s already defined: %s", CACHE_NAME, e.getMessage());
    }
  }

  @Override
  public int increment(String key) {
    for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      Integer current = cache.get(key);
      if (current == null) {
        if (cache.putIfAbsent(key, 1, LIFESPAN_HOURS, TimeUnit.HOURS) == null) return 1;
      } else if (cache.replace(key, current, current + 1, LIFESPAN_HOURS, TimeUnit.HOURS)) {
        return current + 1;
      }
    }
    // Only reachable under extreme contention on one realm's key. Treat it as over any limit
    // rather than letting the send through uncounted.
    log.warnf("Could not increment %s after %d attempts", key, MAX_ATTEMPTS);
    return Integer.MAX_VALUE;
  }
}
