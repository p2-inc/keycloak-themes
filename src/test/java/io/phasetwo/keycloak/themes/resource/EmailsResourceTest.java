package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.Helpers.*;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.MatcherAssert.*;
import static org.junit.Assert.assertNotNull;
import static io.phasetwo.keycloak.themes.theme.AttributeTheme.EMAIL_TEMPLATE_ATTRIBUTE_PREFIX;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import io.phasetwo.keycloak.KeycloakSuite;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import lombok.extern.jbosslog.JBossLog;
import org.apache.http.entity.ContentType;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.entity.mime.HttpMultipartMode;
import org.apache.http.HttpResponse;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.junit.ClassRule;
import org.junit.Test;
import org.junit.Ignore;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.broker.provider.util.SimpleHttp;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.representations.idm.RealmRepresentation;

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
  @Ignore
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
  @Ignore
  public void testGetNonexistentTemplate() throws Exception {
    Keycloak keycloak = server.client();
    SimpleHttp.Response response = SimpleHttp.doGet(url("master", "templates", "text", "foo-bar"), httpClient)
                                   .auth(keycloak.tokenManager().getAccessTokenString())
                                   .asResponse();
    assertThat(response.getStatus(), is(404));
  }

  @Test
  public void testGetUpdateTemplate() throws Exception {
    Keycloak keycloak = server.client();
    RealmRepresentation r = keycloak.realm("master").toRepresentation();
    r.setEmailTheme("attributes");
    keycloak.realm("master").update(r);

    // GET /templates/text/email-verification
    SimpleHttp.Response response = SimpleHttp.doGet(url("master", "templates", "text", "email-verification"), httpClient)
                                   .auth(keycloak.tokenManager().getAccessTokenString())
                                   .asResponse();
    assertThat(response.getStatus(), is(200));
    String template = response.asString();
    assertThat(template, containsString("Someone has created"));
    
    // PUT /templates/text/email-verification
    String templatePlus = template + "\n\nfoo bar";
    HttpPut put = new HttpPut(url("master", "templates", "text", "email-verification"));
    StringBody templateBody = new StringBody(templatePlus, ContentType.MULTIPART_FORM_DATA);
    MultipartEntityBuilder builder = MultipartEntityBuilder.create();
    builder.setMode(HttpMultipartMode.BROWSER_COMPATIBLE);
    builder.addPart("template", templateBody);
    put.setEntity(builder.build());
    put.addHeader("Authorization", "Bearer "+keycloak.tokenManager().getAccessTokenString());
    HttpResponse resp = httpClient.execute(put);
    assertThat(resp.getStatusLine().getStatusCode(), is(204));

    // GET /templates/text/email-verification
    response = SimpleHttp.doGet(url("master", "templates", "text", "email-verification"), httpClient)
               .auth(keycloak.tokenManager().getAccessTokenString())
               .asResponse();
    assertThat(response.getStatus(), is(200));
    template = response.asString();
    assertThat(template, is(templatePlus));
    assertThat(template, containsString("foo bar"));
    
    // update with a realm attribute
    templatePlus = templatePlus + "\n\ndog cat";
    updateRealmAttribute(server.getKeycloak(), "master", String.format("%s.%s/%s", EMAIL_TEMPLATE_ATTRIBUTE_PREFIX, "text", "email-verification.mustache"), templatePlus);

    // GET /templates/text/email-verification
    response = SimpleHttp.doGet(url("master", "templates", "text", "email-verification"), httpClient)
               .auth(keycloak.tokenManager().getAccessTokenString())
               .asResponse();
    assertThat(response.getStatus(), is(200));
    template = response.asString();
    assertThat(template, is(templatePlus));
    assertThat(template, containsString("dog cat"));
  }
}
