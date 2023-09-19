package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.Helpers.*;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.MatcherAssert.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import lombok.extern.jbosslog.JBossLog;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.broker.provider.util.SimpleHttp;
import org.testcontainers.junit.jupiter.Container;

@JBossLog
public class AssetsResourceTest {

  @Container
  public static final KeycloakContainer container =
      new KeycloakContainer(getDockerImage())
          .withContextPath("/auth")
          .withReuse(true)
          .withProviderClassesFrom("target/classes")
          .withEnv("KC_SPI_EMAIL_TEMPLATE_PROVIDER", "freemarker-plus-mustache")
          .withEnv("KC_SPI_EMAIL_TEMPLATE_FREEMARKER_PLUS_MUSTACHE_ENABLED", "true")
          .withDisabledCaching()
          .withProviderLibsFrom(
              getDeps(
                  "com.github.spullara.mustache.java:compiler",
                  "io.phasetwo.keycloak:keycloak-extensions"));

  @BeforeAll
  public static void beforeAll() {
    container.start();
  }

  @AfterAll
  public static void afterAll() {
    container.stop();
  }

  CloseableHttpClient httpClient = HttpClients.createDefault();

  static Keycloak getKeycloak() {
    return container.getKeycloakAdminClient();
  }

  @Test
  public void testCss() throws Exception {
    String url =
        String.format("%s/realms/master/assets/css/login.css", container.getAuthServerUrl());
    String css = SimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());

    updateRealmAttribute(
        getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_PRIMARY_COLOR, "#000000");
    css = SimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());
    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));

    updateRealmAttribute(
        getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_SECONDARY_COLOR, "#0AF0AF");
    css = SimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());
    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-global--secondary-color--100: #0AF0AF;"));

    updateRealmAttribute(
        getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_BACKGROUND_COLOR, "#FAAFAA");
    css = SimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());
    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-global--secondary-color--100: #0AF0AF;"));
    assertThat(css, containsString("--pf-global--BackgroundColor--100: #FAAFAA;"));

    log.infof(css);
    String newCss = "/* foobar */";
    updateRealmAttribute(getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_CSS, newCss);
    css = SimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());
    assertThat(css, is(newCss));
  }
}
