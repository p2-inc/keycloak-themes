package io.phasetwo.keycloak.themes.resource;

import java.util.Map;

/**
 * {@link EmailLimitTest} with Keycloak's clustered (embedded Infinispan) cache stack, as on a
 * multi-node deployment, where the provider has to define {@code counterCache} as a replicated
 * cache so that every node counts against the same limit.
 */
public class ClusteredEmailLimitTest extends EmailLimitTest {

  @Override
  Map<String, String> extraEnv() {
    return Map.of("KC_CACHE", "ispn");
  }

  @Override
  String expectedCacheMode() {
    return "replicated";
  }
}
