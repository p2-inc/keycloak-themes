package io.phasetwo.keycloak.themes.resource;

import com.google.common.base.Strings;
import com.google.common.io.CharSource;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.services.Urls;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.theme.Theme;

@JBossLog
public class AssetsResourceProvider implements RealmResourceProvider {

  private KeycloakSession session;

  public AssetsResourceProvider(KeycloakSession session) {
    this.session = session;
  }

  public static final String ASSETS_LOGIN_PREFIX = "_providerConfig.assets.login";
  public static final String ASSETS_LOGIN_PRIMARY_COLOR = ASSETS_LOGIN_PREFIX + ".primaryColor";
  public static final String ASSETS_LOGIN_SECONDARY_COLOR = ASSETS_LOGIN_PREFIX + ".secondaryColor";
  public static final String ASSETS_LOGIN_BACKGROUND_COLOR =
      ASSETS_LOGIN_PREFIX + ".backgroundColor";
  public static final String ASSETS_LOGIN_CSS = "_providerConfig.assets.login.css";

  @Override
  public Object getResource() {
    return this;
  }

  public static final String ASSETS_LOGO_URL = "_providerConfig.assets.logo.url";
  public static final String ASSETS_FAVICON_URL = "_providerConfig.assets.favicon.url";
  public static final String DEFAULT_LOGO_PATH = "img/empty.png";
  public static final String DEFAULT_FAVICON_PATH = "img/default-favicon.ico";

  @GET
  @Path("img/logo")
  public Response logo(@Context HttpHeaders headers, @Context UriInfo uriInfo) throws IOException {
    return resourceRedirect(uriInfo, ASSETS_LOGO_URL, DEFAULT_LOGO_PATH);
  }

  @GET
  @Path("img/favicon")
  public Response favicon(@Context HttpHeaders headers, @Context UriInfo uriInfo)
      throws IOException {
    return resourceRedirect(uriInfo, ASSETS_FAVICON_URL, DEFAULT_FAVICON_PATH);
  }

  private Response resourceRedirect(UriInfo uriInfo, String key, String defaultPath) {
    String imgUrl = session.getContext().getRealm().getAttribute(key);
    URI redir = null;
    try {
      if (imgUrl == null) {
        Theme theme = session.theme().getTheme(Theme.Type.LOGIN);
        URI baseUri = session.getContext().getUri().getBaseUri();
        URI themeRoot = new URI(Urls.themeRoot(baseUri).toString() + "/");
        redir =
            themeRoot.resolve(
                String.format(
                    "%s/%s/%s",
                    theme.getType().toString().toLowerCase(), theme.getName(), defaultPath));
      } else {
        redir = new URI(imgUrl);
      }
      log.infof("redirecting to %s", redir);
      return Response.seeOther(redir).build();
    } catch (Exception e) {
      throw new NotFoundException(e);
    }
  }

  private void setColors(StringBuilder o) {
    setColor(o, ASSETS_LOGIN_PRIMARY_COLOR, "--pf-v5-global--primary-color--100");
    setColor(o, ASSETS_LOGIN_PRIMARY_COLOR, "--pf-v5-global--active-color--100");
    setColor(o, ASSETS_LOGIN_PRIMARY_COLOR, "--pf-v5-global--primary-color--dark-100");
    setColor(o, ASSETS_LOGIN_PRIMARY_COLOR, "--pf-v5-global--link--Color");
    setColor(o, ASSETS_LOGIN_PRIMARY_COLOR, "--pf-v5-global--link--Color--dark");
    setColor(o, ASSETS_LOGIN_SECONDARY_COLOR, "--pf-v5-global--primary-color--200");
    setColor(o, ASSETS_LOGIN_SECONDARY_COLOR, "--pf-v5-global--link--Color--hover");
    setColor(o, ASSETS_LOGIN_SECONDARY_COLOR, "--pf-v5-global--link--Color--dark--hover");
    setColor(o, ASSETS_LOGIN_BACKGROUND_COLOR, "--pf-v5-global--BackgroundColor--100");
  }

  private void setColor(StringBuilder o, String key, String name) {
    String v = session.getContext().getRealm().getAttribute(key);
    if (v != null) {
      o.append(name).append(": ").append(v).append(";\n");
    }
  }

  @GET
  @Path("css/login.css")
  @Produces("text/css")
  public Response cssLogin(@Context HttpHeaders headers, @Context UriInfo uriInfo)
      throws IOException {
    String css = session.getContext().getRealm().getAttribute(ASSETS_LOGIN_CSS);
    if (Strings.isNullOrEmpty(css)) {
      StringBuilder o = new StringBuilder("/* login css */\n");
      o.append(":root {\n");
      setColors(o);
      o.append("}\n");
      css = o.toString();
    }
    InputStream resource = CharSource.wrap(css).asByteSource(StandardCharsets.UTF_8).openStream();
    String mimeType = "text/css";
    return null == resource
        ? Response.status(Response.Status.NOT_FOUND).build()
        : Response.ok(resource, mimeType).build();
  }

  @Override
  public void close() {}
}
