package io.phasetwo.keycloak.themes.resource;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.jboss.shrinkwrap.resolver.api.maven.Maven;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.keycloak.admin.client.Keycloak;
import org.testcontainers.junit.jupiter.Container;

public abstract class AbstractResourceTest {

  public static final String KEYCLOAK_IMAGE =
      String.format(
          "quay.io/phasetwo/keycloak-crdb:%s", System.getProperty("keycloak-version", "26.0.2"));

  static final String[] deps = {"com.github.spullara.mustache.java:compiler"};

  static List<File> getDeps() {
    List<File> dependencies = new ArrayList<File>();
    for (String dep : deps) {
      dependencies.addAll(getDep(dep));
    }
    return dependencies;
  }

  static List<File> getDep(String pkg) {
    return Maven.resolver()
        .loadPomFromFile("./pom.xml")
        .resolve(pkg)
        .withoutTransitivity()
        .asList(File.class);
  }

  @Container
  public static final KeycloakContainer container =
      new KeycloakContainer(KEYCLOAK_IMAGE)
          .withContextPath("/auth")
          .withReuse(true)
          .withProviderClassesFrom("target/classes")
          .withEnv("KC_SPI_EMAIL_TEMPLATE_PROVIDER", "freemarker-plus-mustache")
          .withEnv("KC_SPI_EMAIL_TEMPLATE_FREEMARKER_PLUS_MUSTACHE_ENABLED", "true")
          .withDisabledCaching()
          .withProviderLibsFrom(getDeps());

  @BeforeAll
  public static void beforeAll() {
    container.start();
  }

  @AfterAll
  public static void afterAll() {
    container.stop();
  }

  protected CloseableHttpClient httpClient = HttpClients.createDefault();

  public static Keycloak getKeycloak() {
    return container.getKeycloakAdminClient();
  }
}
