package io.phasetwo.keycloak.themes.theme;

import com.google.auto.service.AutoService;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Comparator;
import lombok.extern.jbosslog.JBossLog;
import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.theme.ThemeProvider;
import org.keycloak.theme.ThemeProviderFactory;

/** */
@JBossLog
@AutoService(ThemeProviderFactory.class)
public class AttributeThemeProviderFactory implements ThemeProviderFactory {

  public static final String PROVIDER_ID = "ext-theme-provider-attribute";

  @Override
  public ThemeProvider create(KeycloakSession session) {
    log.trace("Creating AttributeThemeProvider");
    return new AttributeThemeProvider(session);
  }

  @Override
  public void init(Config.Scope config) {}

  @Override
  public void postInit(KeycloakSessionFactory factory) {}

  @Override
  public void close() {}

  static void deleteRecursively(File dir) throws IOException {
    Path toDelete = dir.toPath();

    java.nio.file.Files.walk(toDelete)
        .sorted(Comparator.reverseOrder())
        .map(Path::toFile)
        .forEach(File::delete);

    log.tracef("%s deleted? %b", toDelete, java.nio.file.Files.exists(toDelete));
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }
}
