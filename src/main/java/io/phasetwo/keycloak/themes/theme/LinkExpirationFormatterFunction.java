package io.phasetwo.keycloak.themes.theme;

import com.google.common.collect.ImmutableList;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.theme.beans.LinkExpirationFormatterMethod;

@JBossLog
public class LinkExpirationFormatterFunction extends FormatterFunction {

  public LinkExpirationFormatterFunction(
      Properties rb, Locale locale, Map<String, Object> attributes) {
    super(rb, locale, attributes);
  }

  @Override
  String format(String input) throws Exception {
    LinkExpirationFormatterMethod freemarkerMethod = new LinkExpirationFormatterMethod(rb, locale);
    Object result = freemarkerMethod.exec(ImmutableList.of(input));
    log.debugf("format link expiration from %s to %s", input, result);
    return result.toString();
  }
}
