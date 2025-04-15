package io.phasetwo.keycloak.email;

import com.google.auto.service.AutoService;
import org.keycloak.provider.Provider;
import org.keycloak.provider.ProviderFactory;
import org.keycloak.provider.Spi;

@AutoService(Spi.class)
public class MessageBuilderSpi implements Spi {

  @Override
  public boolean isInternal() {
    return false;
  }

  @Override
  public String getName() {
    return "messageBuilderProvider";
  }

  @Override
  public Class<? extends Provider> getProviderClass() {
    return MessageBuilderProvider.class;
  }

  @Override
  @SuppressWarnings("rawtypes")
  public Class<? extends ProviderFactory> getProviderFactoryClass() {
    return MessageBuilderProviderFactory.class;
  }
}
