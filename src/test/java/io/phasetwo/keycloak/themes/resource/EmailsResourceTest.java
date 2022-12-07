package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.Helpers.*;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.MatcherAssert.*;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import io.phasetwo.keycloak.KeycloakSuite;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import lombok.extern.jbosslog.JBossLog;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.junit.ClassRule;
import org.junit.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.broker.provider.util.SimpleHttp;

@JBossLog
public class EmailsResourceTest {

  @ClassRule public static KeycloakSuite server = KeycloakSuite.SERVER;

  CloseableHttpClient httpClient = HttpClients.createDefault();

  String baseUrl(String realm) {
    return String.format("%s/realms/%s/emails", server.getAuthUrl(), realm);
  }

  String url(String realm, String... segments) {
    StringBuilder o = new StringBuilder();
    for (String segment : segments) {
      o.append("/").append(segment);
    }
    return String.format("%s%s", baseUrl(realm), o.toString());
  }

  @Test
  public void testGetTemplates() throws Exception {
    Keycloak keycloak = server.client();
    // GET /templates
    SimpleHttp.Response response = SimpleHttp.doGet(url("master", "templates"), httpClient)
                                   .auth(keycloak.tokenManager().getAccessTokenString())
                                   .asResponse();
    assertThat(response.getStatus(), is(200));
    Map<String,String> templates = response.asJson(new TypeReference<Map<String,String>>() {});
    for (String key : EmailsResource.EMAIL_TEMPLATES.keySet()) {
      assertNotNull(templates.get(key));
      assertThat(templates.get(key), is(EmailsResource.EMAIL_TEMPLATES.get(key).toString()));
    }
  }

  @Test
  public void testGetUpdateTemplate() throws Exception {
    // GET /templates/text/email-verification
    
    // PUT /templates/text/email-verification

    // GET /templates/text/email-verification
  }

}
