package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.themes.theme.AttributeTheme.templateKey;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetup;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Sends real emails, which renders them through Keycloak's template cache.
 *
 * <p>Keycloak's {@code DefaultFreeMarkerProvider} caches each parsed template under {@code
 * email/<theme name>/<template>}, together with a loader holding the {@code Theme} it was first
 * rendered with. Later emails, from any realm and any request, render through that theme.
 */
@Testcontainers
public class EmailTemplateCacheTest extends AbstractResourceTest {

  static final GreenMail mail = new GreenMail(new ServerSetup(0, null, ServerSetup.PROTOCOL_SMTP));

  @BeforeAll
  static void startMail() {
    mail.start();
    org.testcontainers.Testcontainers.exposeHostPorts(mail.getSmtp().getPort());
  }

  @AfterAll
  static void stopMail() {
    mail.stop();
  }

  /**
   * Realm A overrides the verification email's body; realm B doesn't. B's user must get the theme's
   * email, not A's override.
   */
  @Test
  @Disabled("https://github.com/p2-inc/keycloak-themes/issues/110")
  void anOverrideInOneRealmIsNotSentToAnotherRealmsUsers() throws Exception {
    Keycloak keycloak = getKeycloak();
    String realmA = createRealm(keycloak, "cache-override-a");
    String realmB = createRealm(keycloak, "cache-override-b");
    setRealmAttribute(
        keycloak.realm(realmA),
        templateKey("html/email-verification.ftl"),
        "<p>REALM-A-MARKER</p>");

    UserRepresentation userA = createUser(keycloak, realmA, "user-a@example.com");
    UserRepresentation userB = createUser(keycloak, realmB, "user-b@example.com");

    keycloak.realm(realmA).users().get(userA.getId()).sendVerifyEmail();
    assertThat(bodyOfOnlyMessageTo("user-a@example.com"), containsString("REALM-A-MARKER"));

    keycloak.realm(realmB).users().get(userB.getId()).sendVerifyEmail();
    assertThat(bodyOfOnlyMessageTo("user-b@example.com"), not(containsString("REALM-A-MARKER")));
  }

  /**
   * Realm C sends first. Were the cached template bound to C's session, which closes when that
   * request ends, the next render after FreeMarker's 5s update delay would recheck the imported
   * {@code template.ftl} through it. That works while C is in the realm cache, but updating C
   * evicts it, and nothing looks C up by name before realm D's email.
   */
  @Test
  void anotherRealmsEmailStillSendsAfterTheFirstSendersRealmIsUpdated() throws Exception {
    Keycloak keycloak = getKeycloak();
    String realmC = createRealm(keycloak, "cache-session-c");
    String realmD = createRealm(keycloak, "cache-session-d");
    UserRepresentation userC = createUser(keycloak, realmC, "user-c@example.com");
    UserRepresentation userD = createUser(keycloak, realmD, "user-d@example.com");

    keycloak
        .realm(realmC)
        .users()
        .get(userC.getId())
        .executeActionsEmail(List.of("UPDATE_PASSWORD"));
    assertThat(messagesTo("user-c@example.com"), hasSize(1));

    Thread.sleep(6_000);
    RealmResource c = keycloak.realm(realmC);
    RealmRepresentation rep = c.toRepresentation();
    rep.setDisplayName("Realm C, updated");
    c.update(rep);

    assertDoesNotThrow(
        () ->
            keycloak
                .realm(realmD)
                .users()
                .get(userD.getId())
                .executeActionsEmail(List.of("UPDATE_PASSWORD")),
        "realm D's email failed to render");
    assertThat(messagesTo("user-d@example.com"), hasSize(1));
  }

  String createRealm(Keycloak keycloak, String name) {
    RealmRepresentation r = new RealmRepresentation();
    r.setRealm(name);
    r.setEnabled(true);
    r.setEmailTheme("keycloak");
    r.setSmtpServer(
        Map.of(
            "host", "host.testcontainers.internal",
            "port", String.valueOf(mail.getSmtp().getPort()),
            "from", "noreply@example.com"));
    keycloak.realms().create(r);
    return name;
  }

  void setRealmAttribute(RealmResource realm, String key, String value) {
    RealmRepresentation rep = realm.toRepresentation();
    Map<String, String> attributes =
        rep.getAttributes() == null ? new HashMap<>() : new HashMap<>(rep.getAttributes());
    attributes.put(key, value);
    rep.setAttributes(attributes);
    realm.update(rep);
  }

  UserRepresentation createUser(Keycloak keycloak, String realm, String email) {
    UserRepresentation user = new UserRepresentation();
    user.setEnabled(true);
    user.setUsername(email);
    user.setEmail(email);
    keycloak.realm(realm).users().create(user).close();
    return keycloak.realm(realm).users().searchByEmail(email, true).get(0);
  }

  List<MimeMessage> messagesTo(String email) {
    return Arrays.stream(mail.getReceivedMessages())
        .filter(
            m -> {
              try {
                return Arrays.stream(m.getAllRecipients())
                    .anyMatch(r -> r.toString().contains(email));
              } catch (MessagingException e) {
                throw new RuntimeException(e);
              }
            })
        .toList();
  }

  String bodyOfOnlyMessageTo(String email) {
    List<MimeMessage> messages = messagesTo(email);
    assertThat(messages, hasSize(1));
    return GreenMailUtil.getBody(messages.get(0));
  }
}
