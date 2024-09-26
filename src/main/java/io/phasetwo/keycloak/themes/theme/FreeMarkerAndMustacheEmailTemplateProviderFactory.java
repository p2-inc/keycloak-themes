package io.phasetwo.keycloak.themes.theme;

import com.google.auto.service.AutoService;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.email.EmailTemplateProvider;
import org.keycloak.email.EmailTemplateProviderFactory;
import org.keycloak.email.freemarker.FreeMarkerEmailTemplateProviderFactory;
import org.keycloak.models.KeycloakSession;

@JBossLog
@AutoService(EmailTemplateProviderFactory.class)
public class FreeMarkerAndMustacheEmailTemplateProviderFactory
    extends FreeMarkerEmailTemplateProviderFactory {
  @Override
  public EmailTemplateProvider create(KeycloakSession session) {
    log.debugf("creating new FreeMarkerAndMustacheEmailTemplateProviderFactory");
    return new FreeMarkerAndMustacheEmailTemplateProvider(session);
  }

  @Override
  public String getId() {
    return "freemarker-plus-mustache";
  }
}
