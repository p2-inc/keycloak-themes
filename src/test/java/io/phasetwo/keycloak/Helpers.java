package io.phasetwo.keycloak;

import com.google.common.collect.Lists;
import java.io.File;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.jboss.shrinkwrap.resolver.api.maven.Maven;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

public class Helpers {

  public static String getKeycloakVersion() {
    String version = System.getProperty("keycloakVersion");
    if (version == null) throw new IllegalStateException("keycloakVersion not set");
    return version;
  }

  public static String getDockerImage() {
    return String.format("quay.io/phasetwo/keycloak-crdb:%s", getKeycloakVersion());
  }

  public static List<File> getDeps(String... paths) {
    List<File> dependencies = Lists.newArrayList();
    for (String path : paths) {
      dependencies.addAll(getDeps(path));
    }
    return dependencies;
  }

  private static List<File> getDeps(String path) {
    List<File> dependencies =
        Maven.resolver()
            .loadPomFromFile("./pom.xml")
            .resolve(path)
            .withoutTransitivity()
            .asList(File.class);
    return dependencies;
  }

  public static void updateRealmAttribute(
      Keycloak keycloak, String realm, String key, String value) {
    RealmResource res = keycloak.realm(realm);
    RealmRepresentation rep = res.toRepresentation();
    Map<String, String> attr = rep.getAttributes();
    if (attr == null) {
      attr = new HashMap<>();
    }
    attr.put(key, value);
    res.update(rep);
  }

  public static UserRepresentation createUser(Keycloak keycloak, String realm, String username) {
    UserRepresentation user = new UserRepresentation();
    user.setEnabled(true);
    user.setUsername(username);
    keycloak.realm(realm).users().create(user);
    return user;
  }

  public static String urlencode(String u) {
    try {
      return URLEncoder.encode(u, "UTF-8");
    } catch (Exception e) {
      return "";
    }
  }

  public static int nextFreePort(int from, int to) {
    for (int port = from; port <= to; port++) {
      if (isLocalPortFree(port)) {
        return port;
      }
    }
    throw new IllegalStateException("No free port found");
  }

  private static boolean isLocalPortFree(int port) {
    try {
      new ServerSocket(port).close();
      return true;
    } catch (IOException e) {
      return false;
    }
  }
}
