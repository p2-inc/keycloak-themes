package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.Helpers.updateRealmAttribute;
import static io.phasetwo.keycloak.themes.theme.AttributeTheme.EMAIL_TEMPLATE_ATTRIBUTE_PREFIX;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;

import com.fasterxml.jackson.core.type.TypeReference;
import io.phasetwo.keycloak.LegacySimpleHttp;
import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.mime.HttpMultipartMode;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.entity.mime.content.StringBody;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.RealmRepresentation;
import org.testcontainers.junit.jupiter.Testcontainers;

@JBossLog
@Testcontainers
public class EmailsResourceTest extends AbstractResourceTest {

  String baseUrl(String realm) {
    return String.format("%s/realms/%s/emails", container.getAuthServerUrl(), realm);
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
    Keycloak keycloak = getKeycloak();
    // GET /templates
    LegacySimpleHttp.Response response =
        LegacySimpleHttp.doGet(url("master", "templates"), httpClient)
            .auth(keycloak.tokenManager().getAccessTokenString())
            .asResponse();
    assertThat(response.getStatus(), is(200));
    Map<String, String> templates = response.asJson(new TypeReference<Map<String, String>>() {});
    for (String key : EmailsResource.EMAIL_TEMPLATES.keySet()) {
      assertThat(templates.get(key), notNullValue());
      assertThat(templates.get(key), is(EmailsResource.EMAIL_TEMPLATES.get(key).toString()));
    }
  }

  @Test
  public void testGetNonexistentTemplate() throws Exception {
    Keycloak keycloak = getKeycloak();
    LegacySimpleHttp.Response response =
        LegacySimpleHttp.doGet(url("master", "templates", "text", "foo-bar"), httpClient)
            .auth(keycloak.tokenManager().getAccessTokenString())
            .asResponse();
    assertThat(response.getStatus(), is(404));
  }

  /** Mustache themes: the override is a whole document, keyed on .mustache. */
  @Test
  public void testGetUpdateTemplateMaster() throws Exception {
    testGetUpdateTemplate("master", "attributes", "mustache", "Someone has created");
  }

  @Test
  public void testGetUpdateTemplateNonMaster() throws Exception {
    testGetUpdateTemplate(createRealm("test"), "attributes", "mustache", "Someone has created");
  }

  /** Legacy attribute theme name, kept working for backwards compatibility. */
  @Test
  public void testGetUpdateTemplateLegacyAttributesV2Theme() throws Exception {
    testGetUpdateTemplate(
        createRealm("test-attributes-v2"), "attributes-v2", "mustache", "Someone has created");
  }

  /**
   * phasetwo-ui renders with FreeMarker, so its overrides are keyed on .ftl and carry the action
   * content only -- the branded template.ftl shell stays the theme's. Before this the PUT stored a
   * .mustache attribute that nothing ever read back.
   */
  @Test
  public void testGetUpdateTemplatePhaseTwoUiTheme() throws Exception {
    testGetUpdateTemplate(
        createRealm("test-phasetwo-ui"), "phasetwo-ui", "ftl", "emailVerificationBody");
  }

  /** Any other FreeMarker theme is keyed the same way, including the stock Keycloak one. */
  @Test
  public void testGetUpdateTemplateStockKeycloakTheme() throws Exception {
    testGetUpdateTemplate(
        createRealm("test-keycloak-theme"), "keycloak", "ftl", "emailVerificationBody");
  }

  String createRealm(String realmName) {
    Keycloak keycloak = getKeycloak();
    RealmRepresentation r = new RealmRepresentation();
    r.setRealm(realmName);
    r.setEnabled(true);
    keycloak.realms().create(r);
    return realmName;
  }

  void testGetUpdateTemplate(
      String realmName, String emailTheme, String expectedExtension, String expectedDefaultContent)
      throws Exception {
    Keycloak keycloak = getKeycloak();
    RealmRepresentation r = keycloak.realm(realmName).toRepresentation();
    r.setEmailTheme(emailTheme);
    keycloak.realm(realmName).update(r);

    // GET /templates/text/email-verification
    LegacySimpleHttp.Response response =
        LegacySimpleHttp.doGet(
                url(realmName, "templates", "text", "email-verification"), httpClient)
            .auth(keycloak.tokenManager().getAccessTokenString())
            .asResponse();
    assertThat(response.getStatus(), is(200));
    String template = response.asString();
    assertThat(template, containsString(expectedDefaultContent));

    // PUT /templates/text/email-verification
    String templatePlus = template + "\n\nfoo bar";
    HttpPut put = new HttpPut(url(realmName, "templates", "text", "email-verification"));
    StringBody templateBody = new StringBody(templatePlus, ContentType.MULTIPART_FORM_DATA);
    MultipartEntityBuilder builder = MultipartEntityBuilder.create();
    builder.setMode(HttpMultipartMode.BROWSER_COMPATIBLE);
    builder.addPart("template", templateBody);
    put.setEntity(builder.build());
    put.addHeader("Authorization", "Bearer " + keycloak.tokenManager().getAccessTokenString());
    HttpResponse resp = httpClient.execute(put);
    assertThat(resp.getStatusLine().getStatusCode(), is(204));

    // GET /templates/text/email-verification
    response =
        LegacySimpleHttp.doGet(
                url(realmName, "templates", "text", "email-verification"), httpClient)
            .auth(keycloak.tokenManager().getAccessTokenString())
            .asResponse();
    assertThat(response.getStatus(), is(200));
    template = response.asString();
    assertThat(template, is(templatePlus));
    assertThat(template, containsString("foo bar"));

    // update with a realm attribute
    templatePlus = templatePlus + "\n\ndog cat";
    updateRealmAttribute(
        getKeycloak(),
        realmName,
        String.format(
            "%s.%s/%s.%s",
            EMAIL_TEMPLATE_ATTRIBUTE_PREFIX, "text", "email-verification", expectedExtension),
        templatePlus);

    // GET /templates/text/email-verification
    response =
        LegacySimpleHttp.doGet(
                url(realmName, "templates", "text", "email-verification"), httpClient)
            .auth(keycloak.tokenManager().getAccessTokenString())
            .asResponse();
    assertThat(response.getStatus(), is(200));
    template = response.asString();
    assertThat(template, is(templatePlus));
    assertThat(template, containsString("dog cat"));
  }
}
