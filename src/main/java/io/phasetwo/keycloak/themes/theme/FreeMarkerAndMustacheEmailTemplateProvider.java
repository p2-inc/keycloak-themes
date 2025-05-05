package io.phasetwo.keycloak.themes.theme;

import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import io.phasetwo.keycloak.email.AttributesBuilderProvider;
import java.io.IOException;
import java.text.MessageFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.stream.Stream;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.email.EmailException;
import org.keycloak.email.freemarker.FreeMarkerEmailTemplateProvider;
import org.keycloak.email.freemarker.beans.ProfileBean;
import org.keycloak.forms.login.freemarker.model.UrlBean;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakUriInfo;
import org.keycloak.models.RealmModel;
import org.keycloak.theme.FreeMarkerException;
import org.keycloak.theme.Theme;
import org.keycloak.utils.StringUtil;

@JBossLog
public class FreeMarkerAndMustacheEmailTemplateProvider extends FreeMarkerEmailTemplateProvider {

  public FreeMarkerAndMustacheEmailTemplateProvider(KeycloakSession session) {
    super(session);
  }

  @Override
  protected EmailTemplate processTemplate(
      String subjectKey,
      List<Object> subjectAttributes,
      String template,
      Map<String, Object> attributes)
      throws EmailException {
    try {
      Theme theme = getTheme();
      log.debugf("processTemplate for %s in theme %s", template, theme.getName());

      // runAttributesBuilder
      //  clone in case it's immutable
      List<Object> subjAttr = Lists.newArrayList(subjectAttributes);
      Map<String, Object> attr = Maps.newHashMap(attributes);
      try {
        int s = subjAttr.size();
        int b = attr.size();
        runAttributesBuilder(realm, subjAttr, attr);
        log.debugf(
            "Attributes builder (subject %d -> %d) (body %d -> %d)",
            s, subjAttr.size(), b, attr.size());
      } catch (Exception e) {
        log.warn("Error running attributes builder", e);
      }

      if (MustacheProvider.isMustacheTheme(theme)
          && MustacheProvider.hasMustacheTemplates(theme, template)) {
        log.debugf("Using mustache template for %s in theme %s", template, theme.getName());
        return processMustacheTemplate(subjectKey, subjAttr, template, attr);
      } else {
        return super.processTemplate(subjectKey, subjAttr, template, attr);
      }
    } catch (IOException e) {
      throw new EmailException("Failed to template email", e);
    }
  }

  private EmailTemplate processMustacheTemplate(
      String subjectKey,
      List<Object> subjectAttributes,
      String template,
      Map<String, Object> attributes)
      throws EmailException {
    try {
      Theme theme = getTheme();
      Locale locale = session.getContext().resolveLocale(user);
      attributes.put("locale", locale);

      // Expose locale_xy flags
      Stream stream = realm.getSupportedLocalesStream();
      if (stream != null) {
        stream.forEach(
            loc -> {
              String key = String.format("locale_%s", loc);
              Boolean ok = locale.getLanguage().equals(loc);
              attributes.put(key, ok);
            });
      }

      KeycloakUriInfo uriInfo = session.getContext().getUri();
      Properties rb = new Properties();
      if (!StringUtil.isNotBlank(realm.getDefaultLocale())) {
        rb.putAll(realm.getRealmLocalizationTextsByLocale(realm.getDefaultLocale()));
      }
      rb.putAll(theme.getMessages(locale));
      rb.putAll(realm.getRealmLocalizationTextsByLocale(locale.toLanguageTag()));
      // attributes.put("msg", new MessageFormatterMethod(locale, rb));
      attributes.put(
          "linkExpirationFormatter", new LinkExpirationFormatterFunction(rb, locale, attributes));
      attributes.put(
          "requiredActionFormatter", new RequiredActionFormatterFunction(rb, locale, attributes));
      attributes.put("properties", theme.getProperties());
      attributes.put("realmName", getRealmName());
      attributes.put("user", new ProfileBean(user, session));
      attributes.put("url", new UrlBean(realm, theme, uriInfo.getBaseUri(), null));

      String subject =
          new MessageFormat(rb.getProperty(subjectKey, subjectKey), locale)
              .format(subjectAttributes.toArray());
      String textTemplate = String.format("text/%s", template);
      String textBody;
      try {
        textBody = MustacheProvider.processTemplate(attributes, textTemplate, theme);
      } catch (final FreeMarkerException e) {
        throw new EmailException("Failed to template plain text email.", e);
      }
      String htmlTemplate = String.format("html/%s", template);
      String htmlBody;
      try {
        htmlBody = MustacheProvider.processTemplate(attributes, htmlTemplate, theme);
      } catch (final FreeMarkerException e) {
        throw new EmailException("Failed to template html email.", e);
      }

      return new EmailTemplate(subject, textBody, htmlBody);
    } catch (Exception e) {
      throw new EmailException("Failed to template email", e);
    }
  }

  private void runAttributesBuilder(
      RealmModel realm, List<Object> subjectAttributes, Map<String, Object> bodyAttributes)
      throws Exception {
    AttributesBuilderProvider ab = null;
    try {
      ab = session.getProvider(AttributesBuilderProvider.class);
    } catch (Exception e) {
      log.debug("Can't load AttributesBuilderProvider", e);
      return;
    }
    ab.updateAttributes(realm, subjectAttributes, bodyAttributes);
  }
}
