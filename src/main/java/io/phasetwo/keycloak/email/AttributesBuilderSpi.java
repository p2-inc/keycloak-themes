package io.phasetwo.keycloak.email;

import com.google.auto.service.AutoService;
import org.keycloak.provider.Provider;
import org.keycloak.provider.ProviderFactory;
import org.keycloak.provider.Spi;

@AutoService(Spi.class)
public class AttributesBuilderSpi implements Spi {

  @Override
  public boolean isInternal() {
    return false;
  }

  @Override
  public String getName() {
    return "attributesBuilder";
  }

  @Override
  public Class<? extends Provider> getProviderClass() {
    return AttributesBuilderProvider.class;
  }

  @Override
  @SuppressWarnings("rawtypes")
  public Class<? extends ProviderFactory> getProviderFactoryClass() {
    return AttributesBuilderProviderFactory.class;
  }
}
