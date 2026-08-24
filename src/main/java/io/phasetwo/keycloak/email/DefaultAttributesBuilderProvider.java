package io.phasetwo.keycloak.email;

import com.google.common.base.Strings;
import io.phasetwo.keycloak.themes.resource.LoginThemeCss;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.email.EmailException;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

@JBossLog
public class DefaultAttributesBuilderProvider implements AttributesBuilderProvider {

  static final String FOOTER_LINE1_ATTRIBUTE = "_providerConfig.assets.email.footer.line1";
  static final String FOOTER_LINE2_ATTRIBUTE = "_providerConfig.assets.email.footer.line2";

  protected final KeycloakSession session;

  public DefaultAttributesBuilderProvider(KeycloakSession session) {
    this.session = session;
  }

  @Override
  public void updateAttributes(
      RealmModel realm, List<Object> subjectAttributes, Map<String, Object> bodyAttributes)
      throws EmailException {
    Map<String, Object> branding = new HashMap<>();

    String logoBase64 = realm.getAttribute(DefaultMessageBuilderProvider.LOGO_BASE64_ATTRIBUTE);
    if (!Strings.isNullOrEmpty(logoBase64)) {
      branding.put("logoLight", logoBase64);
    }

    String footerLine1 = realm.getAttribute(FOOTER_LINE1_ATTRIBUTE);
    if (!Strings.isNullOrEmpty(footerLine1)) {
      branding.put("footerLine1", footerLine1);
    }

    String footerLine2 = realm.getAttribute(FOOTER_LINE2_ATTRIBUTE);
    if (!Strings.isNullOrEmpty(footerLine2)) {
      branding.put("footerLine2", footerLine2);
    }

    // Brand tokens the realm has explicitly set, resolved by the same code the login
    // page uses so the two cannot disagree. Email clients do not support CSS variables,
    // so these are interpolated into inline styles by the template; only tokens the
    // realm actually set are passed, letting the template's own defaults stand
    // otherwise. Light only -- dark-mode handling across email clients is too
    // inconsistent to target.
    Map<String, String> theme = LoginThemeCss.explicitLightTokens(realm::getAttribute);
    if (!theme.isEmpty()) {
      branding.put("theme", theme);
    }

    if (!branding.isEmpty()) {
      bodyAttributes.put("branding", branding);
      log.debugf("Set branding attributes for realm %s", realm.getName());
    }
  }

  @Override
  public void close() {}
}
