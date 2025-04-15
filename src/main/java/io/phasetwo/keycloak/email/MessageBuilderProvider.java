package io.phasetwo.keycloak.email;

import jakarta.mail.Message;
import jakarta.mail.Multipart;
import org.keycloak.email.EmailException;
import org.keycloak.provider.Provider;

public interface MessageBuilderProvider extends Provider {

  void updateMessage(Message message, Multipart multipart) throws EmailException;
}
