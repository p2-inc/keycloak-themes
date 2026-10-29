package io.phasetwo.keycloak.themes.resource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.junit.jupiter.api.Test;

/** The phasetwo-ui welcome theme, selected in {@link AbstractResourceTest}'s container. */
public class WelcomeThemeTest extends AbstractResourceTest {

  @Test
  public void rootShowsNeutralPageInsteadOfRedirectingToAdminConsole() throws Exception {
    // The container bootstraps its admin user, so the stock theme would answer with a 302 to
    // /admin/. Redirects are not followed, so a redirect fails the status check.
    RequestConfig noRedirects = RequestConfig.custom().setRedirectsEnabled(false).build();
    try (CloseableHttpClient client =
            HttpClients.custom().setDefaultRequestConfig(noRedirects).build();
        CloseableHttpResponse response =
            client.execute(new HttpGet(container.getAuthServerUrl() + "/"))) {
      assertEquals(200, response.getStatusLine().getStatusCode());
      String html = EntityUtils.toString(response.getEntity());
      assertTrue(html.contains("This is a sign-in service"), html);
      assertFalse(html.contains("Administration Console"), html);
      assertFalse(html.contains("logo.svg"), html);
      assertTrue(html.contains("class=\"p2-welcome\""), html);

      // The page is styled by the theme's own stylesheet, which must actually be served. The
      // template links it relative to the root.
      Matcher stylesheet =
          Pattern.compile("href=\"([^\"]*/welcome/phasetwo-ui/css/phasetwo-welcome\\.css)\"")
              .matcher(html);
      assertTrue(stylesheet.find(), html);
      String cssUrl =
          container.getAuthServerUrl() + "/" + stylesheet.group(1).replaceFirst("^/", "");
      try (CloseableHttpResponse css = client.execute(new HttpGet(cssUrl))) {
        assertEquals(200, css.getStatusLine().getStatusCode());
        assertTrue(EntityUtils.toString(css.getEntity()).contains(".p2-welcome"));
      }
    }
  }
}
