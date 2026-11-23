package io.phasetwo.keycloak.email;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.infinispan.configuration.cache.CacheMode;
import org.infinispan.manager.DefaultCacheManager;
import org.junit.jupiter.api.Test;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

class EmailCounterTest {

  @Test
  void localCounterCountsPerKey() {
    LocalEmailCounter counter = new LocalEmailCounter();
    assertThat(counter.increment("a-2026-11-23"), is(1));
    assertThat(counter.increment("a-2026-11-23"), is(2));
    assertThat(counter.increment("b-2026-11-23"), is(1));
    assertThat(counter.increment("a-2026-11-23"), is(3));
  }

  @Test
  void localCounterDropsEarlierDays() {
    LocalEmailCounter counter = new LocalEmailCounter();
    counter.increment("a-2026-11-23");
    counter.increment("b-2026-11-23");
    assertThat(counter.size(), is(2));
    assertThat(counter.increment("a-2026-11-24"), is(1));
    assertThat(counter.size(), is(1));
  }

  @Test
  void localCounterIsAtomic() throws Exception {
    LocalEmailCounter counter = new LocalEmailCounter();
    ExecutorService pool = Executors.newFixedThreadPool(8);
    for (int i = 0; i < 1000; i++) pool.submit(() -> counter.increment("a-2026-11-23"));
    pool.shutdown();
    pool.awaitTermination(10, TimeUnit.SECONDS);
    assertThat(counter.increment("a-2026-11-23"), is(1001));
  }

  @Test
  void fallbackCountsLocallyWhenThePrimaryFails() {
    EmailCounter failing =
        key -> {
          throw new IllegalStateException("cache unavailable");
        };
    FallbackEmailCounter counter = new FallbackEmailCounter(failing, new LocalEmailCounter());
    assertThat(counter.increment("a-2026-11-23"), is(1));
    assertThat(counter.increment("a-2026-11-23"), is(2));
  }

  /** The cache is missing from the Infinispan configuration, as on a server without it in XML. */
  @Test
  void infinispanCounterDefinesTheCacheWhenAbsent() throws Exception {
    try (DefaultCacheManager cacheManager = new DefaultCacheManager()) {
      assertThat(
          cacheManager.getCacheConfiguration(InfinispanEmailCounter.CACHE_NAME), nullValue());
      InfinispanEmailCounter.defineIfAbsent(cacheManager);
      assertThat(
          cacheManager
              .getCacheConfiguration(InfinispanEmailCounter.CACHE_NAME)
              .clustering()
              .cacheMode(),
          is(CacheMode.LOCAL));
      // Defining twice is harmless.
      InfinispanEmailCounter.defineIfAbsent(cacheManager);

      InfinispanEmailCounter counter =
          new InfinispanEmailCounter(cacheManager.getCache(InfinispanEmailCounter.CACHE_NAME));
      assertThat(counter.increment("a-2026-11-23"), is(1));
      assertThat(counter.increment("a-2026-11-23"), is(2));
      assertThat(counter.increment("b-2026-11-23"), is(1));

      ExecutorService pool = Executors.newFixedThreadPool(8);
      for (int i = 0; i < 500; i++) pool.submit(() -> counter.increment("c-2026-11-23"));
      pool.shutdown();
      pool.awaitTermination(30, TimeUnit.SECONDS);
      assertThat(counter.increment("c-2026-11-23"), is(501));
    }
  }

  @Test
  void reserveSendAllowsExactlyMaxEmails() {
    OverridableEmailSenderProvider provider = provider(3, new LocalEmailCounter());
    assertThat(provider.reserveSend(), is(true));
    assertThat(provider.reserveSend(), is(true));
    assertThat(provider.reserveSend(), is(true));
    assertThat(provider.reserveSend(), is(false));
    assertThat(provider.reserveSend(), is(false));
  }

  @Test
  void reserveSendWithNegativeMaxEmailsIsUnlimitedAndDoesNotCount() {
    AtomicInteger increments = new AtomicInteger();
    OverridableEmailSenderProvider provider = provider(-1, key -> increments.incrementAndGet());
    for (int i = 0; i < 10; i++) assertThat(provider.reserveSend(), is(true));
    assertThat(increments.get(), is(0));
  }

  @Test
  void reserveSendSharesTheCountAcrossProviders() {
    LocalEmailCounter counter = new LocalEmailCounter();
    assertThat(provider(1, counter).reserveSend(), is(true));
    assertThat(provider(1, counter).reserveSend(), is(false));
  }

  private static OverridableEmailSenderProvider provider(int maxEmails, EmailCounter counter) {
    KeycloakSession session = mock(KeycloakSession.class);
    KeycloakContext context = mock(KeycloakContext.class);
    RealmModel realm = mock(RealmModel.class);
    when(session.getContext()).thenReturn(context);
    when(context.getRealm()).thenReturn(realm);
    when(realm.getName()).thenReturn("test-realm");
    return new OverridableEmailSenderProvider(session, Map.of(), Map.of(), maxEmails, counter);
  }
}
