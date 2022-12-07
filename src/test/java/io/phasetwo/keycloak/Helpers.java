package io.phasetwo.keycloak;

import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.MatcherAssert.*;
import static org.junit.Assert.assertNotNull;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.URLEncoder;
import java.util.Set;
import org.apache.http.impl.client.CloseableHttpClient;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.broker.provider.util.SimpleHttp;
import org.keycloak.representations.idm.RealmEventsConfigRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

public class Helpers {

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
