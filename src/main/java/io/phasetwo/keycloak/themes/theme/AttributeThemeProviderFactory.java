package io.phasetwo.keycloak.themes.theme;

import com.google.auto.service.AutoService;
import com.google.common.io.Files;
import java.io.File;
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

  private File tmpdir;

  @Override
  public ThemeProvider create(KeycloakSession session) {
    log.debugf("Creating AttributeThemeProvider");
    this.tmpdir = Files.createTempDir();
    return new AttributeThemeProvider(session, tmpdir);
  }

  @Override
  public void init(Config.Scope config) {}

  @Override
  public void postInit(KeycloakSessionFactory factory) {}

  @Override
  public void close() {}

  @Override
  public String getId() {
    return PROVIDER_ID;
  }
}
