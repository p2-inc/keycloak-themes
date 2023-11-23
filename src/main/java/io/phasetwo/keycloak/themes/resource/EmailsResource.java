package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.themes.theme.AttributeTheme.*;
import static jakarta.ws.rs.core.MediaType.MULTIPART_FORM_DATA_TYPE;

import com.google.common.collect.ImmutableMap;
import io.phasetwo.keycloak.themes.theme.AttributeTheme;
import io.phasetwo.keycloak.themes.theme.MustacheProvider;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.jboss.resteasy.plugins.providers.multipart.InputPart;
import org.jboss.resteasy.plugins.providers.multipart.MultipartFormDataInput;
import org.keycloak.models.KeycloakSession;
import org.keycloak.theme.Theme;
import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.http.FormPartValue;
import org.keycloak.http.HttpRequest;

@JBossLog
public class EmailsResource extends AbstractAdminResource {

  public EmailsResource(KeycloakSession session) {
    super(session);
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
          .put("magic-link-email", "Magic link")
          .put("invitation-email", "Organization invitation")
          .put("otp-email", "OTP Code")
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

  private boolean templateExists(String templateName) {
    return (EMAIL_TEMPLATES.get(templateName) != null);
  }

  private Theme getEmailThemeForRealm(KeycloakSession session) throws IOException {
    log.infof("get email theme for realm %s", realm.getName());
    session.setAttribute(AttributeTheme.REALM_ATTRIBUTE_KEY, realm.getName());
    return session.theme().getTheme(realm.getEmailTheme(), Theme.Type.EMAIL);
  }

  @GET
  @Produces(MediaType.TEXT_PLAIN)
  @Path("templates/{templateType}/{templateName}")
  public String getEmailTemplate(
      @PathParam("templateType") String templateType,
      @PathParam("templateName") String templateName) {
    if (!permissions.realm().canViewRealm()) {
      throw new ForbiddenException("Get email template requires view-realm");
    }
    if (!templateExists(templateName)) {
      throw new NotFoundException(templateName + " not found");
    }
    String templatePath = getTemplatePath(templateType, templateName);
    log.debugf("getEmailTempate for %s", templatePath);
    String key = templateKey(templatePath);
    try {
      return MustacheProvider.templateToString(templatePath, getEmailThemeForRealm(session));
    } catch (IOException e) {
      throw new NotFoundException("Unable to get template " + templateName, e);
    }
  }

  @PUT
  @Path("templates/{templateType}/{templateName}")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  public Response updateEmailTemplate(
      @PathParam("templateType") String templateType,
      @PathParam("templateName") String templateName) {
    if (!permissions.realm().canManageRealm()) {
      throw new ForbiddenException("Update email template requires manage-realm");
    }
    if (!templateExists(templateName)) {
      throw new NotFoundException(templateName + " not found");
    }

    HttpRequest req = session.getContext().getHttpRequest();
    log.infof("mediaType %s", req.getHttpHeaders().getMediaType());
    log.infof("contentType %s", req.getHttpHeaders().getHeaderString("content-type"));

    MediaType mediaType = req.getHttpHeaders().getMediaType();
    log.infof("isCompatible %b", MULTIPART_FORM_DATA_TYPE.isCompatible(mediaType));
    log.infof("hasBoundary %b", mediaType.getParameters().containsKey("boundary"));

    //log.infof("body %s", template);

    MultivaluedMap<String, FormPartValue> formDataMap = session.getContext().getHttpRequest().getMultiPartFormParameters();
    if (formDataMap != null) {
      log.infof("formDataMap %s", formDataMap);
      for (String k : formDataMap.keySet()) {
        log.infof("key %s", k);
      }
    }

    if (!formDataMap.containsKey("template")) {
      throw new BadRequestException("No template part present");
    }

    String key = templateKey(getTemplatePath(templateType, templateName));

    try {
      String template = formDataMap.getFirst("template").asString();
      log.debugf("setting realm attribute %s to %s", key, template);
      realm.setAttribute(key, template);
      return Response.noContent().build();
    } catch (Exception e) {
      throw new InternalServerErrorException("Error updating attribute for template " + key, e);
    }
  }
}
