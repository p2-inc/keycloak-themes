package io.phasetwo.keycloak.themes.theme;

import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.function.Function;
import lombok.extern.jbosslog.JBossLog;

@JBossLog
public abstract class FormatterFunction implements Function<String, String> {

  protected final Properties rb;
  protected final Locale locale;
  protected final Map<String, Object> attributes;

  FormatterFunction(Properties rb, Locale locale, Map<String, Object> attributes) {
    this.rb = rb;
    this.locale = locale;
    this.attributes = attributes;
  }

  abstract String format(String input) throws Exception;

  @Override
  public String apply(String input) {
    try {
      return format(input);
    } catch (Exception e) {
      log.warn("error formatting for " + input, e);
    }
    return "";
  }
}
