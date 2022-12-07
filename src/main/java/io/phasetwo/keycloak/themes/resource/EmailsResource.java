package io.phasetwo.keycloak.themes.resource;

import com.google.common.collect.ImmutableMap;
import io.phasetwo.keycloak.themes.theme.MustacheProvider;
import java.io.IOException;
import java.util.Map;
import java.util.List;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.core.Response;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.theme.Theme;
import javax.ws.rs.core.MultivaluedMap;
import org.jboss.resteasy.plugins.providers.multipart.InputPart;
import org.jboss.resteasy.plugins.providers.multipart.MultipartFormDataInput;

@JBossLog
public class EmailsResource extends AbstractAdminResource {

  private final KeycloakSession session;

  public EmailsResource(RealmModel realm, KeycloakSession session) {
    super(realm);
    this.session = session;
  }

  public static final Map<String, Object> EMAIL_TEMPLATES =
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
  @Path("templates")
  public Map<String, Object> listEmailTemplates(
      @Context HttpHeaders headers, @Context UriInfo uriInfo) {
    if (!permissions.realm().canViewRealm()) {
      throw new ForbiddenException("Get email templates requires view-realm");
    }
    return EMAIL_TEMPLATES;
  }

  private String getTemplatePath(String templateType, String templateName) {
    return String.format("%s/%s.mustache", templateType, templateName);
  }
    
  @GET
  @Produces(MediaType.TEXT_PLAIN)
  @Path("templates/{templateType}/{templateName}")
  public String getEmailTemplate(@PathParam("templateType") String templateType, @PathParam("templateName") String templateName) {
    if (!permissions.realm().canViewRealm()) {
      throw new ForbiddenException("Get email template requires view-realm");
    }
    String templatePath = getTemplatePath(templateType, templateName);
    log.infof("getEmailTempate for %s", templatePath);
    try {
      return MustacheProvider.templateToString(templatePath, session.theme().getTheme(Theme.Type.EMAIL));
    } catch (IOException e) {
      throw new NotFoundException("Unable to get template " + templateName, e);
    }
  }

  @PUT
  @Path("templates/{templateType}/{templateName}")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  public Response updateEmailTemplate(@PathParam("templateType") String templateType, @PathParam("templateName") String templateName, MultipartFormDataInput input) {
    if (!permissions.realm().canManageRealm()) {
      throw new ForbiddenException("Update email template requires manage-realm");
    }
    Map<String, List<InputPart>> formDataMap = input.getFormDataMap();
    if (!formDataMap.containsKey("template")) {
      throw new BadRequestException("No template part present");
    }
    String key = String.format("_providerConfig.templates.email.%s", getTemplatePath(templateType, templateName));
    try {
      String template = formDataMap.get("template").get(0).getBodyAsString();
      realm.setAttribute(key, template);
      return Response.created(session.getContext().getUri().getAbsolutePathBuilder().build()).build();
    } catch (IOException e) {
      throw new InternalServerErrorException("Error updating attribute for template "+key, e);
    }      
  }

}
