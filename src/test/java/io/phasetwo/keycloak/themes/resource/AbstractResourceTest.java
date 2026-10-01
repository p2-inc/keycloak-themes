package io.phasetwo.keycloak.themes.resource;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.jboss.shrinkwrap.resolver.api.maven.Maven;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.keycloak.admin.client.Keycloak;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.utility.MountableFile;

public abstract class AbstractResourceTest {

  public static final String KEYCLOAK_IMAGE =
      String.format(
          "quay.io/phasetwo/keycloak-crdb:%s", System.getProperty("keycloak-version", "26.8.0"));

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

  @Container public static final KeycloakContainer container = buildContainer();

  private static KeycloakContainer buildContainer() {
    KeycloakContainer keycloakContainer =
        new KeycloakContainer(KEYCLOAK_IMAGE)
            .withContextPath("/auth")
            .withReuse(true)
            .withProviderClassesFrom("target/classes")
            .withEnv("KC_SPI_EMAIL_TEMPLATE_PROVIDER", "freemarker-plus-mustache")
            .withEnv("KC_SPI_EMAIL_TEMPLATE_FREEMARKER_PLUS_MUSTACHE_ENABLED", "true")
            .withDisabledCaching()
            // Themes stay uncached, but parsed templates are cached, as in a server that follows
            // the README and sets only --spi-theme-cache-themes=false.
            .withEnv("KC_SPI_THEME__CACHE_TEMPLATES", "true")
            .withAccessToHost(true)
            .withProviderLibsFrom(getDeps());

    // These tests exercise the extension inside the server, so coverage has to be collected
    // there: mount the agent staged by maven-dependency-plugin and point the server's JVM at it.
    // JAVA_OPTS_APPEND rather than JAVA_OPTS so the image's own defaults survive. Skipped when
    // the agent has not been staged, which keeps IDE runs and partial builds working.
    if (isJacocoPresent()) {
      keycloakContainer =
          keycloakContainer
              .withCopyFileToContainer(
                  MountableFile.forHostPath(Path.of("target/jacoco-agent/"), 0755), "/jacoco-agent")
              .withEnv(
                  "JAVA_OPTS_APPEND",
                  "-javaagent:/jacoco-agent/org.jacoco.agent-runtime.jar=destfile=/tmp/jacoco.exec");
    }
    return keycloakContainer;
  }

  private static boolean isJacocoPresent() {
    return Files.exists(Path.of("target/jacoco-agent/org.jacoco.agent-runtime.jar"));
  }

  @BeforeAll
  public static void beforeAll() {
    container.start();
  }

  /**
   * The agent only writes its {@code destfile} when the JVM exits, so the container has to be
   * stopped <em>before</em> the exec file is copied out, not after. Each test class gets its own
   * container, so the file is named by container id and the jacoco plugin merges them.
   */
  @AfterAll
  public static void afterAll() throws IOException {
    if (isJacocoPresent()) {
      String containerId = container.getContainerId();
      String shortId = containerId.length() > 12 ? containerId.substring(0, 12) : containerId;
      container.getDockerClient().stopContainerCmd(containerId).exec();
      Files.createDirectories(Path.of("target", "jacoco-report"));
      container.copyFileFromContainer(
          "/tmp/jacoco.exec", "./target/jacoco-report/jacoco-%s.exec".formatted(shortId));
    }
    container.stop();
  }

  protected CloseableHttpClient httpClient = HttpClients.createDefault();

  public static Keycloak getKeycloak() {
    return container.getKeycloakAdminClient();
  }
}
