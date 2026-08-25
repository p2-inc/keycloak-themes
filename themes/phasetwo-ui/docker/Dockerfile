# Dev image for the phasetwo-ui theme.
#
# The base image already bundles a released keycloak-themes jar. Mounting our
# locally built jar alongside it leaves two copies of every provider in
# /opt/keycloak/providers, and which one wins is not deterministic -- a stale
# copy surfaces as NoSuchMethodError against Keycloak APIs it was not built
# against. So drop the bundled jar and copy ours in by glob, which also means
# no version string to keep in sync here.
FROM quay.io/phasetwo/phasetwo-keycloak:latest

USER root
RUN rm -f /opt/keycloak/providers/io.phasetwo.keycloak-keycloak-themes-*.jar
COPY --chown=keycloak:keycloak target/keycloak-themes-*-SNAPSHOT.jar \
  /opt/keycloak/providers/keycloak-themes-dev.jar
USER keycloak
