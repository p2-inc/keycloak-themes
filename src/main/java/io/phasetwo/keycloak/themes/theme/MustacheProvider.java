package io.phasetwo.keycloak.themes.theme;

import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;
import com.google.common.io.Files;
import com.google.common.io.Resources;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.Writer;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.theme.FreeMarkerException;
import org.keycloak.theme.Theme;

/** Processes mustache templates. */
@JBossLog
public class MustacheProvider {

  public static final String MUSTACHE_FILE_EXTENSION = "mustache";

  public static String processTemplate(Object data, String templateName, Theme theme)
      throws FreeMarkerException {
    templateName = getMustacheName(theme, templateName);
    try {
      MustacheFactory mf = new DefaultMustacheFactory();
      Mustache mustache =
          mf.compile(new StringReader(templateToString(templateName, theme)), templateName);
      Writer writer = new StringWriter();
      mustache.execute(writer, data);
      writer.flush();
      return writer.toString();
    } catch (Exception e) {
      throw new FreeMarkerException("Error processing mustache template " + templateName, e);
    }
  }

  public static boolean isMustacheTheme(Theme theme) {
    try {
      if (theme.getProperties() != null) {
        String type = theme.getProperties().getProperty("templateType");
        log.debugf("templateType=%s", type);
        if ("mustache".equals(type)) return true;
      }
    } catch (Exception ignore) {
    }
    return false;
  }

  /**
   * Which engine renders {@code template} for {@code theme}. The renderer and the admin endpoint
   * that stores overrides must agree on this: a mustache-rendered template is overridden with a
   * whole mustache document, a FreeMarker-rendered one with FreeMarker action content, and keying an
   * override the other way round means it is stored but never read.
   *
   * <p>A theme declaring {@code templateType=mustache} (the {@code mustache} theme and the legacy
   * {@code attributes*} themes built on it) is rendered with mustache. Any other theme is rendered
   * with FreeMarker so its own templates -- and the shell they import -- are what runs, falling back
   * to mustache per-template for ones it does not ship (magic link and OTP live in the {@code
   * mustache} parent). Note that {@code base} supplies a .ftl for most names, so mere .ftl existence
   * is not the question.
   */
  public static boolean rendersWithMustache(Theme theme, String template) throws IOException {
    boolean mustacheAvailable = hasMustacheTemplates(theme, template);
    if (isMustacheTheme(theme)) return mustacheAvailable;
    return !hasFreeMarkerTemplates(theme, template) && mustacheAvailable;
  }

  public static boolean hasFreeMarkerTemplates(Theme theme, String template) throws IOException {
    String name = FREEMARKER_EXTENSION.matcher(template).replaceFirst("") + ".ftl";
    for (String dir : new String[] {"html", "text"}) {
      if (theme.getTemplate(String.format("%s/%s", dir, name)) == null) return false;
    }
    return true;
  }

  private static final Pattern FREEMARKER_EXTENSION = Pattern.compile("\\.[^./]+$");

  public static boolean hasMustacheTemplates(Theme theme, String template) {
    String nameAsMustache = getMustacheName(theme, template);
    try {
      String[] dirs = {"text", "html"};
      for (String dir : dirs) {
        String path = String.format("%s/%s", dir, nameAsMustache);
        log.debugf("Trying mustache template at %s", path);
        URL u = theme.getTemplate(path);
        if (u == null) return false;
      }
      return true;
    } catch (Exception ignore) {
    }
    return false;
  }

  public static String getMustacheName(Theme theme, String template) {
    String ext = Files.getFileExtension(template);
    if (ext == null || ext.equals("mustache")) return template;
    String name = template.substring(0, template.length() - ext.length());
    return String.format("%s%s", name, MustacheProvider.MUSTACHE_FILE_EXTENSION);
  }

  public static String templateToString(String templateName, Theme theme) throws IOException {
    log.debugf(
        "templateName: %s, themeName: %s, url: %s",
        templateName, theme.getName(), theme.getTemplate(templateName));
    return Resources.toString(theme.getTemplate(templateName), StandardCharsets.UTF_8);
  }
}
