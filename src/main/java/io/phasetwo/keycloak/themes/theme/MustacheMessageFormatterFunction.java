package io.phasetwo.keycloak.themes.theme;

import com.github.mustachejava.TemplateFunction;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;

public class MustacheMessageFormatterFunction implements TemplateFunction {

  private final Properties rb;
  private final Locale locale;
  private final Map<String, Object> attributes;

  public MustacheMessageFormatterFunction(
      Properties rb, Locale locale, Map<String, Object> attributes) {
    this.rb = rb;
    this.locale = locale;
    this.attributes = attributes;
  }

  @Override
  public String apply(String input) {
    return "";
    // return new MessageFormat(messages.getProperty(key, key), locale).format(resolved.toArray());
  }
}
