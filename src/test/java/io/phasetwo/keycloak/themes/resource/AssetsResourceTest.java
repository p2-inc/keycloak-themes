package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.Helpers.*;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.MatcherAssert.*;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.core.type.TypeReference;
import io.phasetwo.keycloak.KeycloakSuite;
import java.net.URLEncoder;
import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.junit.ClassRule;
import org.junit.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.broker.provider.util.SimpleHttp;

@JBossLog
public class AssetsResourceTest {

  @ClassRule public static KeycloakSuite server = KeycloakSuite.SERVER;

  CloseableHttpClient httpClient = HttpClients.createDefault();

  @Test
  public void testCss() throws Exception {
    String url = String.format("%s/realms/master/assets/css/login.css", server.getAuthUrl());
    String css = SimpleHttp.doGet(url, httpClient).asString();
    assertNotNull(css);

    updateRealmAttribute(server.getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_PRIMARY_COLOR, "#000000");
    css = SimpleHttp.doGet(url, httpClient).asString();
    assertNotNull(css);
    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));

    updateRealmAttribute(server.getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_SECONDARY_COLOR, "#0AF0AF");
    css = SimpleHttp.doGet(url, httpClient).asString();
    assertNotNull(css);
    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-global--secondary-color--100: #0AF0AF;"));

    updateRealmAttribute(server.getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_BACKGROUND_COLOR, "#FAAFAA");
    css = SimpleHttp.doGet(url, httpClient).asString();
    assertNotNull(css);
    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-global--secondary-color--100: #0AF0AF;"));
    assertThat(css, containsString("--pf-global--BackgroundColor--100: #FAAFAA;"));

    log.infof(css);
    String newCss = "/* foobar */";
    updateRealmAttribute(server.getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_CSS, newCss);
    css = SimpleHttp.doGet(url, httpClient).asString();
    assertNotNull(css);
    assertThat(css, is(newCss));
  }
}
