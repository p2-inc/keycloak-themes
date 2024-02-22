package io.phasetwo.keycloak;

import com.google.common.collect.ObjectArrays;
import com.google.common.io.MoreFiles;
import com.google.common.io.RecursiveDeleteOption;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.rules.TestRule;
import org.junit.runner.Description;
import org.junit.runners.model.Statement;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.testsuite.KeycloakServer;

public class KeycloakSuite implements TestRule {

  public static final KeycloakSuite SERVER = new KeycloakSuite();
  private final AtomicBoolean initialized = new AtomicBoolean();
  private KeycloakServer keycloak;
  private int port;

  @Override
  public synchronized Statement apply(Statement base, Description description) {
    if (!initialized.get()) {
      init();
      initialized.set(true);
    }
    return base;
  }

  public KeycloakServer getKeycloak() {
    return this.keycloak;
  }

  public int getPort() {
    return this.port;
  }

  public String getAuthUrl() {
    return String.format("%sauth", getRootUrl());
  }

  public String getRootUrl() {
    return String.format("http://127.0.0.1:%d/", getPort());
  }

  private static final String[] ARGS = {};

  private static final String[] PROPS = {
    "keycloak.bind.address=127.0.0.1",
    "java.net.preferIPv4Stack=true",
    "keycloak.connectionsJpa.url=jdbc:h2:file:./target/data/keycloak_4_x_master",
    "keycloak.connectionsJpa.driver=org.h2.Driver",
    "keycloak.connectionsJpa.driverDialect=org.hibernate.dialect.H2Dialect",
    "keycloak.connectionsJpa.user=sa",
    "keycloak.connectionsJpa.password=",
    "profile=COMMUNITY",
    "product.default-profile=COMMUNITY",
    "keycloak.password.blacklists.path=./target/data/blacklists/",
    "com.sun.net.ssl.checkRevocation=false",
    "keycloak.product.name=keycloak",
    "product.name=keycloak",
    "keycloak.profile=preview",
    "keycloak.profile.feature.account_api=enabled",
    "keycloak.profile.feature.account2=enabled",
    "keycloak.profile.feature.scripts=enabled",
    "keycloak.emailTemplate.provider=freemarker-plus-mustache",
    "keycloak.theme.cacheThemes=false"
  };
  //    "product.version=${keycloak.version}",

  private void setSystemProps(String[] props) {
    for (String prop : props) {
      String[] t = prop.split("=");
      String val = t.length < 2 ? "" : t[1];
      System.setProperty(t[0], val);
    }
  }

  private void deleteDataDirs() throws IOException {
    Path data = Paths.get("./target/data");
    if (Files.exists(data)) {
      MoreFiles.deleteRecursively(data, RecursiveDeleteOption.ALLOW_INSECURE);
    }
  }

  private void init() {
    port = Helpers.nextFreePort(8082, 10000);
    String portProp = String.format("keycloak.port=%d", port);
    String[] props = ObjectArrays.concat(PROPS, portProp);
    setSystemProps(props);
    try {
      deleteDataDirs();
      keycloak = KeycloakServer.bootstrapKeycloakServer(ARGS);
    } catch (Throwable e) {
      throw new IllegalStateException("Unable to start KeycloakServer", e);
    }
  }

  public Keycloak client() {
    return getAdminClient(getAuthUrl(), "master", "admin-cli", "admin", "admin");
  }

  private static Keycloak getAdminClient(
      String url, String realm, String clientId, String username, String password) {
    Keycloak keycloak =
        KeycloakBuilder.builder()
            .serverUrl(url)
            .realm(realm)
            .grantType(OAuth2Constants.PASSWORD)
            .clientId(clientId)
            .username(username)
            .password(password)
            .build();
    return keycloak;
  }

}
