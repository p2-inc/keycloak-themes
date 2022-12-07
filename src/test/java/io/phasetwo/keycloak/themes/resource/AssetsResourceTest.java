package io.phasetwo.keycloak.themes.resource;

import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.MatcherAssert.*;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.core.type.TypeReference;
import io.phasetwo.keycloak.KeycloakSuite;
import java.net.URLEncoder;
import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.junit.ClassRule;
import org.junit.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.broker.provider.util.SimpleHttp;

@JBossLog
public class AssetsResourceTest {

  @ClassRule public static KeycloakSuite server = KeycloakSuite.SERVER;

  CloseableHttpClient httpClient = HttpClients.createDefault();

  //  @Path("css/login.css")
  @Test
  public void testCss() throws Exception {
    String url = String.format("%s/realms/master/assets/css/login.css", server.getAuthUrl());
    String response = SimpleHttp.doGet(url, httpClient).asString();
    assertNotNull(response);
  }

  //images?
  /*
  try {
    BufferedImage originalImage = ImageIO.read(inputStream);
  } finally {
    inputStream.close();
  }
  */    
}
