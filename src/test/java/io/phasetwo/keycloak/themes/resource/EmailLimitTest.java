package io.phasetwo.keycloak.themes.resource;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;

import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.ServerSetup;
import dasniko.testcontainers.keycloak.KeycloakContainer;
import java.util.Map;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

/**
 * The daily email limit of the {@code ext-email-override} sender, on a server whose Infinispan
 * configuration does not declare the {@code counterCache} it counts in. The provider has to define
 * the cache itself; it used to fail to get it and send without any limit.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class EmailLimitTest {

  static final int MAX_EMAILS = 2;

  final GreenMail mail = new GreenMail(new ServerSetup(0, null, ServerSetup.PROTOCOL_SMTP));
  KeycloakContainer container;

  /** Environment added to the container, on top of the email sender configuration. */
  Map<String, String> extraEnv() {
    return Map.of();
  }

  @BeforeAll
  void start() {
    mail.start();
    org.testcontainers.Testcontainers.exposeHostPorts(mail.getSmtp().getPort());
    container =
        new KeycloakContainer(AbstractResourceTest.KEYCLOAK_IMAGE)
            .withContextPath("/auth")
            .withProviderClassesFrom("target/classes")
            .withProviderLibsFrom(AbstractResourceTest.getDeps())
            .withAccessToHost(true)
            .withEnv("KC_SPI_EMAIL_TEMPLATE_PROVIDER", "freemarker-plus-mustache")
            .withEnv("KC_SPI_EMAIL_TEMPLATE_FREEMARKER_PLUS_MUSTACHE_ENABLED", "true")
            .withEnv("KC_SPI_EMAIL_SENDER__PROVIDER", "ext-email-override")
            .withEnv(
                "KC_SPI_EMAIL_SENDER__EXT_EMAIL_OVERRIDE__HOST", "host.testcontainers.internal")
            .withEnv(
                "KC_SPI_EMAIL_SENDER__EXT_EMAIL_OVERRIDE__PORT",
                String.valueOf(mail.getSmtp().getPort()))
            .withEnv("KC_SPI_EMAIL_SENDER__EXT_EMAIL_OVERRIDE__FROM", "global@example.com")
            .withEnv(
                "KC_SPI_EMAIL_SENDER__EXT_EMAIL_OVERRIDE__MAX_EMAILS", String.valueOf(MAX_EMAILS))
            .withEnv(extraEnv());
    container.start();
  }

  @AfterAll
  void stop() {
    if (container != null) container.stop();
    mail.stop();
  }

  @Test
  void aRealmOnTheGlobalSmtpConfigurationIsLimitedPerDay() throws Exception {
    Keycloak keycloak = container.getKeycloakAdminClient();
    String realm = "email-limit";
    RealmRepresentation r = new RealmRepresentation();
    r.setRealm(realm);
    r.setEnabled(true);
    r.setEmailTheme("keycloak");
    keycloak.realms().create(r);

    int before = mail.getReceivedMessages().length;
    for (int i = 0; i < MAX_EMAILS + 3; i++) {
      UserRepresentation user = createUser(keycloak, realm, "limited-" + i + "@example.com");
      keycloak.realm(realm).users().get(user.getId()).sendVerifyEmail();
    }

    assertThat(mail.getReceivedMessages().length - before, is(MAX_EMAILS));
    String logs = container.getLogs();
    assertThat(
        logs, containsString("Defined the counterCache cache (" + expectedCacheMode() + ")"));
    assertThat(logs, containsString("reached its limit of " + MAX_EMAILS + " emails per day"));
    assertThat(logs, not(containsString("ISPN000436")));
  }

  @Test
  void aRealmWithItsOwnSmtpServerIsNotLimited() throws Exception {
    Keycloak keycloak = container.getKeycloakAdminClient();
    String realm = "email-own-smtp";
    RealmRepresentation r = new RealmRepresentation();
    r.setRealm(realm);
    r.setEnabled(true);
    r.setEmailTheme("keycloak");
    r.setSmtpServer(
        Map.of(
            "host", "host.testcontainers.internal",
            "port", String.valueOf(mail.getSmtp().getPort()),
            "from", "realm@example.com"));
    keycloak.realms().create(r);

    int before = mail.getReceivedMessages().length;
    for (int i = 0; i < MAX_EMAILS + 2; i++) {
      UserRepresentation user = createUser(keycloak, realm, "own-" + i + "@example.com");
      keycloak.realm(realm).users().get(user.getId()).sendVerifyEmail();
    }
    assertThat(mail.getReceivedMessages().length - before, is(MAX_EMAILS + 2));
  }

  /** {@code start-dev} runs Keycloak with a local, non-clustered cache manager. */
  String expectedCacheMode() {
    return "local";
  }

  static UserRepresentation createUser(Keycloak keycloak, String realm, String email) {
    UserRepresentation user = new UserRepresentation();
    user.setEnabled(true);
    user.setUsername(email);
    user.setEmail(email);
    keycloak.realm(realm).users().create(user).close();
    return keycloak.realm(realm).users().searchByEmail(email, true).get(0);
  }
}
