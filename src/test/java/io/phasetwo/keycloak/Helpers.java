package io.phasetwo.keycloak;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

public class Helpers {

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
