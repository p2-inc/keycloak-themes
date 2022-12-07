package io.phasetwo.keycloak.themes.theme;

import java.text.MessageFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import lombok.extern.jbosslog.JBossLog;

@JBossLog
public class RequiredActionFormatterFunction extends FormatterFunction {

  public RequiredActionFormatterFunction(
      Properties rb, Locale locale, Map<String, Object> attributes) {
    super(rb, locale, attributes);
  }

  @Override
  String format(String input) throws Exception {
    String key = String.format("%s.%s", "requiredAction", input);
    String result = new MessageFormat(rb.getProperty(key, input), locale).format(null);
    log.infof("format required action from %s to %s", input, result);
    return result.toString();
  }
}
