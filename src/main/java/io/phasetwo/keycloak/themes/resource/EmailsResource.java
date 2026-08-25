package io.phasetwo.keycloak.themes.resource;

import static io.phasetwo.keycloak.themes.theme.AttributeTheme.templateKey;
import static jakarta.ws.rs.core.MediaType.MULTIPART_FORM_DATA_TYPE;

import com.google.common.collect.ImmutableMap;
import io.phasetwo.keycloak.themes.theme.AttributeOverlayTheme;
import io.phasetwo.keycloak.themes.theme.AttributeTheme;
import io.phasetwo.keycloak.themes.theme.MustacheProvider;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.InternalServerErrorException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.http.FormPartValue;
import org.keycloak.http.HttpRequest;
import org.keycloak.models.KeycloakSession;
import org.keycloak.theme.Theme;
import org.keycloak.utils.StringUtil;

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
          .put("magic-link-continuation-email", "Magic link continuation")
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

  /**
   * Path of the template a realm's override stands in for, and therefore the attribute key it is
   * stored under. A theme rendered with FreeMarker (phasetwo-ui) is keyed on {@code .ftl}, the
   * legacy mustache themes on {@code .mustache}, so an override is always the same kind of thing as
   * the template it replaces.
   */
  private String getTemplatePath(Theme theme, String templateType, String templateName) {
    String extension = "mustache";
    try {
      if (theme != null && !MustacheProvider.rendersWithMustache(theme, templateName + ".ftl")) {
        extension = "ftl";
      }
    } catch (IOException e) {
      log.debugf("Error resolving the engine for %s, assuming mustache", templateName);
    }
    return String.format("%s/%s.%s", templateType, templateName, extension);
  }

  /**
   * The editable part of a FreeMarker body: what sits inside {@code <@layout.emailLayout>}, with the
   * generated header comment, the {@code <#ftl>} directive and the layout import removed. The admin
   * edits the action content; the shell stays the theme's, and AttributeOverlayTheme puts the
   * content back inside it when rendering.
   */
  static String editableContent(String templatePath, String template) {
    if (!templatePath.endsWith(".ftl")) return template;
    Matcher m = FTL_LAYOUT_BODY.matcher(template);
    if (m.find()) return m.group(1).trim();
    return FTL_PREAMBLE.matcher(template).replaceAll("").trim();
  }

  private static final Pattern FTL_LAYOUT_BODY =
      Pattern.compile("<@layout\\.emailLayout>(.*)</@layout\\.emailLayout>", Pattern.DOTALL);

  private static final Pattern FTL_PREAMBLE =
      Pattern.compile("(?s)^\\s*(<#ftl[^>]*>|<#--.*?-->|<#import[^>]*>)\\s*", Pattern.MULTILINE);

  private boolean templateExists(String templateName) {
    return (EMAIL_TEMPLATES.get(templateName) != null);
  }

  private Theme getEmailThemeForRealm(KeycloakSession session) throws IOException {
    log.debugf("get email theme for realm %s", realm.getName());
    session.setAttribute(AttributeTheme.REALM_ATTRIBUTE_KEY, realm.getName());
    String emailTheme = realm.getEmailTheme();
    Theme theme =
        StringUtil.isBlank(emailTheme)
            ? session.theme().getTheme(Theme.Type.EMAIL)
            : session.theme().getTheme(emailTheme, Theme.Type.EMAIL);
    // Overlay the realm-attribute overrides so a saved template reads back as saved, whatever
    // email theme the realm is on.
    return AttributeOverlayTheme.wrap(session, theme);
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
    try {
      Theme theme = getEmailThemeForRealm(session);
      String templatePath = getTemplatePath(theme, templateType, templateName);
      log.debugf("getEmailTempate for %s", templatePath);
      if (theme == null || theme.getTemplate(templatePath) == null) {
        throw new NotFoundException(
            String.format(
                "Template %s not found in email theme %s", templatePath, realm.getEmailTheme()));
      }
      return editableContent(templatePath, MustacheProvider.templateToString(templatePath, theme));
    } catch (IOException e) {
      throw new NotFoundException("Unable to get template " + templateName, e);
    }
  }

  @PUT
  @Path("templates/{templateType}/{templateName}")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  public Response updateEmailTemplate(
      @PathParam("templateType") String templateType,
      @PathParam("templateName") String templateName,
      @FormParam("noop") String noop) {
    if (!permissions.realm().canManageRealm()) {
      throw new ForbiddenException("Update email template requires manage-realm");
    }
    if (!templateExists(templateName)) {
      throw new NotFoundException(templateName + " not found");
    }

    MultivaluedMap<String, FormPartValue> formDataMap =
        session.getContext().getHttpRequest().getMultiPartFormParameters();
    if (log.isTraceEnabled()) {
      HttpRequest req = session.getContext().getHttpRequest();
      log.tracef("mediaType %s", req.getHttpHeaders().getMediaType());
      log.tracef("contentType %s", req.getHttpHeaders().getHeaderString("content-type"));
      MediaType mediaType = req.getHttpHeaders().getMediaType();
      log.tracef("isCompatible %b", MULTIPART_FORM_DATA_TYPE.isCompatible(mediaType));
      log.tracef("hasBoundary %b", mediaType.getParameters().containsKey("boundary"));
      if (formDataMap != null) {
        log.tracef("formDataMap %s", formDataMap);
        for (String k : formDataMap.keySet()) {
          log.tracef("key %s", k);
        }
      }
    }

    if (!formDataMap.containsKey("template")) {
      throw new BadRequestException("No template part present");
    }

    String key;
    try {
      key =
          templateKey(getTemplatePath(getEmailThemeForRealm(session), templateType, templateName));
    } catch (IOException e) {
      throw new InternalServerErrorException("Error resolving email theme for " + templateName, e);
    }

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
