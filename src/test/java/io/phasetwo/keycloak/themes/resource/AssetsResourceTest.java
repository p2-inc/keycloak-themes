package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.Helpers.*;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.MatcherAssert.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;

import io.phasetwo.keycloak.LegacySimpleHttp;
import lombok.extern.jbosslog.JBossLog;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Testcontainers;

@JBossLog
@Testcontainers
public class AssetsResourceTest extends AbstractResourceTest {

  @Test
  public void testCss() throws Exception {
    String url =
        String.format("%s/realms/master/assets/css/login.css", container.getAuthServerUrl());
    String css = LegacySimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());

    updateRealmAttribute(
        getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_PRIMARY_COLOR, "#000000");
    css = LegacySimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());
    assertThat(css, containsString("--pf-v5-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-v5-global--active-color--100: #000000"));
    assertThat(css, containsString("--pf-v5-global--primary-color--dark-100: #000000"));
    assertThat(css, containsString("--pf-v5-global--link--Color: #000000"));
    assertThat(css, containsString("--pf-v5-global--link--Color--dark: #000000"));
    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-global--active-color--100: #000000"));
    assertThat(css, containsString("--pf-global--primary-color--dark-100: #000000"));
    assertThat(css, containsString("--pf-global--link--Color: #000000"));
    assertThat(css, containsString("--pf-global--link--Color--dark: #000000"));
    assertThat(css, containsString("--keycloak-card-top-color: #000000"));

    updateRealmAttribute(
        getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_SECONDARY_COLOR, "#0AF0AF");
    css = LegacySimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());
    assertThat(css, containsString("--pf-v5-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-v5-global--active-color--100: #000000"));
    assertThat(css, containsString("--pf-v5-global--primary-color--dark-100: #000000"));
    assertThat(css, containsString("--pf-v5-global--link--Color: #000000"));
    assertThat(css, containsString("--pf-v5-global--link--Color--dark: #000000"));
    assertThat(css, containsString("--keycloak-card-top-color: #000000"));
    assertThat(css, containsString("--pf-v5-global--primary-color--200: #0AF0AF;"));
    assertThat(css, containsString("--pf-v5-global--link--Color--hover: #0AF0AF;"));
    assertThat(css, containsString("--pf-v5-global--link--Color--dark--hover: #0AF0AF;"));

    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-global--active-color--100: #000000"));
    assertThat(css, containsString("--pf-global--primary-color--dark-100: #000000"));
    assertThat(css, containsString("--pf-global--link--Color: #000000"));
    assertThat(css, containsString("--pf-global--link--Color--dark: #000000"));
    assertThat(css, containsString("--pf-global--primary-color--200: #0AF0AF;"));
    assertThat(css, containsString("--pf-global--link--Color--hover: #0AF0AF;"));
    assertThat(css, containsString("--pf-global--link--Color--dark--hover: #0AF0AF;"));

    updateRealmAttribute(
        getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_BACKGROUND_COLOR, "#FAAFAA");
    css = LegacySimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());
    assertThat(css, containsString("--pf-v5-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-v5-global--active-color--100: #000000"));
    assertThat(css, containsString("--pf-v5-global--primary-color--dark-100: #000000"));
    assertThat(css, containsString("--pf-v5-global--link--Color: #000000"));
    assertThat(css, containsString("--pf-v5-global--link--Color--dark: #000000"));
    assertThat(css, containsString("--keycloak-card-top-color: #000000"));
    assertThat(css, containsString("--pf-v5-global--primary-color--200: #0AF0AF;"));
    assertThat(css, containsString("--pf-v5-global--link--Color--hover: #0AF0AF;"));
    assertThat(css, containsString("--pf-v5-global--link--Color--dark--hover: #0AF0AF;"));
    assertThat(css, containsString("--pf-v5-global--BackgroundColor--100: #FAAFAA;"));

    assertThat(css, containsString("--pf-global--primary-color--100: #000000;"));
    assertThat(css, containsString("--pf-global--active-color--100: #000000"));
    assertThat(css, containsString("--pf-global--primary-color--dark-100: #000000"));
    assertThat(css, containsString("--pf-global--link--Color: #000000"));
    assertThat(css, containsString("--pf-global--link--Color--dark: #000000"));
    assertThat(css, containsString("--pf-global--primary-color--200: #0AF0AF;"));
    assertThat(css, containsString("--pf-global--link--Color--hover: #0AF0AF;"));
    assertThat(css, containsString("--pf-global--link--Color--dark--hover: #0AF0AF;"));
    assertThat(css, containsString("--pf-global--BackgroundColor--100: #FAAFAA;"));

    log.infof(css);
    String newCss = "/* foobar */";
    updateRealmAttribute(getKeycloak(), "master", AssetsResourceProvider.ASSETS_LOGIN_CSS, newCss);
    css = LegacySimpleHttp.doGet(url, httpClient).asString();
    assertThat(css, notNullValue());
    assertThat(css, is(newCss));
  }
}
