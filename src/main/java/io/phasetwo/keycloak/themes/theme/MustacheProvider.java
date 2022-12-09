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
    // true for now
    // check in properties? templateType=mustache
    try {
      if (theme.getProperties() != null)
        log.infof("templateType=%s", theme.getProperties().getProperty("templateType"));
    } catch (Exception ignore) {
    }
    // instanceof MustacheTheme?
    return true;
  }

  public static boolean hasMustacheTemplates(Theme theme, String template) {
    String nameAsMustache = getMustacheName(theme, template);
    try {
      String[] dirs = {"text", "html"};
      for (String dir : dirs) {
        String path = String.format("%s/%s", dir, nameAsMustache);
        log.infof("Trying mustache template at %s", path);
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
    log.infof(
        "templateName %s themeName %s url %s",
        templateName, theme.getName(), theme.getTemplate(templateName));
    return Resources.toString(theme.getTemplate(templateName), StandardCharsets.UTF_8);
  }
}
