package io.phasetwo.keycloak.themes.resource;

import com.google.common.collect.ImmutableMap;
import io.phasetwo.keycloak.themes.theme.MustacheProvider;
import java.io.IOException;
import java.util.Map;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.theme.Theme;

@JBossLog
public class EmailsResourceProvider implements RealmResourceProvider {

  private KeycloakSession session;

  public EmailsResourceProvider(KeycloakSession session) {
    this.session = session;
  }

  @Override
  public Object getResource() {
    return this;
  }

  private static final Map<String, Object> EMAIL_TEMPLATES =
      new ImmutableMap.Builder<String, Object>()
          .put("email-verification", "Verification")
          .put("event-login_error", "Login error")
          .put("event-update_password", "Update Password")
          .put("executeActions", "Execute Required Actions")
          .put("password-reset", "Password Reset")
          .put("email-update-confirmation", "Update confirmation")
          .put("email-verification-with-code", "Verification with code")
          .put("event-remove_totp", "Remove OTP")
          .put("event-update_totp", "Update OTP")
          .put("identity-provider-link", "Link to Identity Provider")
          .build();

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("")
  public Map<String, Object> listEmailTemplates(
      @Context HttpHeaders headers, @Context UriInfo uriInfo) {
    return EMAIL_TEMPLATES;
  }

  @GET
  @Produces(MediaType.TEXT_PLAIN)
  @Path("{templateName}")
  public String getEmailTemplate(@PathParam("templateName") String templateName) {
    try {
      return MustacheProvider.templateToString(
          templateName + ".mustache", session.theme().getTheme(Theme.Type.EMAIL));
    } catch (IOException e) {
      throw new InternalServerErrorException("Unable to get template " + templateName, e);
    }
  }

  @Override
  public void close() {}
}
