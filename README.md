> :rocket: **Try it for free** in the new Phase Two [keycloak managed service](https://phasetwo.io/?utm_source=github&utm_medium=readme&utm_campaign=keycloak-themes). See the [announcement and demo video](https://phasetwo.io/blog/self-service/) for more information.

# keycloak-themes

Themes and theme utilities meant for simple theme customization without deploying a packaged theme.

- A modified login theme that allows colors, logo, CSS to be loaded from Realm attributes.
- An implementation of `ThemeProvider` that loads named Freemarker templates and messages from Realm attributes. Currently only for email.
- An implementation of `EmailTemplateProvider` that allows the use of mustache.js templates.
- An implementation of `EmailSenderProvider` that allows overriding SMTP server with defaults.
- An implementation of `ThemeProvider` that allows runtime loading of themes from JAR files. Both globally and per-realm.

This extension is used in the [Phase Two](https://phasetwo.io) cloud offering, and is released here as part of its commitment to making its [core extensions](https://phasetwo.io/docs/introduction/open-source) open source. Please consult the [license](COPYING) for information regarding use.

## Quick start

The easiest way to get started is our [Docker image](https://quay.io/repository/phasetwo/phasetwo-keycloak?tab=tags). Documentation and examples for using it are in the [phasetwo-containers](https://github.com/p2-inc/phasetwo-containers) repo. The most recent version of this extension is included.

## Installation

If you wish to build this yourself, you can do so with a few simple steps:

1. Build the jar:

```
mvn clean install
```

or without tests (quicker) 

```
mvn clean install -DskipTests
```

2. If you are using your own Keycloak, copy the jar produced in `target/` to your `providers` directory (for Quarkus) or `standalone/deployments` directory (for legacy) and rebuild/restart keycloak. 

After #1, you can also run `docker-compose up` if you want to take a quick look against our image. 

## Overview

### Login theme(s)

There are two login themes available. 

- `attributes` for patternfly installations v4 and below
- `attributes-v2` for patternfly installation v5

Both themes assume you will store the values as Realm attributes with the following keys:

- `_providerConfig.assets.login.css`: CSS you want to be loaded after the standard login.css
- `_providerConfig.assets.login.backgroundColor`: override for `--pf-v5-global--primary-color--100`.
- `_providerConfig.assets.login.primaryColor`: override for `--pf-v5-global--secondary-color--100`.
- `_providerConfig.assets.login.secondaryColor`: override for `--pf-v5-global--BackgroundColor--100`.
- `_providerConfig.assets.logo.url`: URL of logo file that will be served as the `div.kc-logo-text.background-image`. Constrained to 150x150.
- `_providerConfig.assets.favicon.url`: URL of the favicon

#### Example CSS overrides

There are 3 examples of CSS themes that can be loaded using the property above. They are in the `examples/` directory. You can either set these as the `_providerConfig.assets.login.css` Realm attribute, or, if you are using the Phase Two admin console theme, set them in the **Styles** -> **Login** section.

- Consumer
- Enterprise
- SaaS

### Email theme

The custom `ThemeProvider` installs one email theme called `attributes` which allows you to override any .ftl template (from base) using Realm attributes with the following key format:

```
_providerConfig.theme.email.templates.<some-template.ftl>
```

Messages can be overridden with the following key format:

```
_providerConfig.theme.email.messages.<message-key>
```

You can also select a different base theme. To use that, set the following variable with the theme you want to override:

```
_providerConfig.theme.email.parent
```

Note that the current base theme is `mustache` which requires the use of the custom `EmailTemplateProvider` below. If you switch it back to `base` by setting the realm attribute, you can override the .ftl templates.

In order to run the email theme, you must turn theme caching off. This is because themes are cached in Keycloak with a common `KeycloakSession`, which will contain the incorrect Realm in the context for lookup of attributes. In practice, we have not noticed a significant performance impact of this. This requires setting the following command line flag for `start` or `start-dev`:

```
--spi-theme-cache-themes=false
```

### Mustache templates

The implementation of `EmailTemplateProvider` that allows the use of mustache.js templates will need to override the default implementation in Keycloak. This has to be specified as an SPI override at startup. If you want to use it, you will need to set the following command line flags for `start` or `start-dev`:

```
--spi-email-template-provider=freemarker-plus-mustache --spi-email-template-freemarker-plus-mustache-enabled=true
```

#### Notes

- For the underlying implementation, we use Sam Pullara's [mustache.java](https://github.com/spullara/mustache.java).

#### Issues

- We get equivalent functionality to the methods like `linkExpirationFormatter(linkExpiration)` by using the library's lambda functionality, and using the mustache-y syntax `{{#linkExpirationFormatter}}{{linkExpiration}}{{/linkExpirationFormatter}}`, but there isn't complete coverage yet.
- There is essentially no i18n at this point, so only the english templates work.

### Email Sender

This includes an implementation of `EmailSenderProvider` which behaves as the default, unless you specify variables to configure provider defaults. In this case, any realm that does not have an SMTP server set up will default to use the values set in the variables. This is useful in environments where a single SMTP server is used by many realms, and the Keycloak administrator does not want to distribute credentials to every realm administrator.

This can also be useful in environments where you want to allow realms to "test" Keycloak's email sending without having to configure an SMTP server. For this use case, we have also included a counter in the distributed cache that is used to limit the number of emails that are sent using the global configuration, in order to prevent spammers from exploiting the free email capability. This can be configured with the `max-emails` variable. To use the limiting functionality, you must have a distributed or replicated cache configuration for `counterCache` in your Infinispan XML cache configuration. E.g.:

```xml
    <replicated-cache name="counterCache">
      <expiration lifespan="-1"/>
    </replicated-cache>
```

If you wish to set the global overrides, you can set the following variables:

| Variable | Required | Default | Description |
| ---- | ---- | ---- | ---- |
| `--spi-email-sender-provider` | yes | `ext-email-override` | Must be set in order to use this provider. |
| `--spi-email-sender-ext-email-override-enabled` | yes | `true` | Must be set in order to use this provider. |
| `--spi-email-sender-ext-email-override-max-emails` | no | 100 | Maximum number of emails that can be sent in a day for a realm using the override. Fails silently after this maximum. Set to `-1` for no limit. |
| `--spi-email-sender-ext-email-override-host` | yes |  | SMTP hostname. Must be set in order to use this provider. |
| `--spi-email-sender-ext-email-override-from` | yes |  | From email address. Must be set in order to use this provider. |
| `--spi-email-sender-ext-email-override-auth` | no | `false` | `true` for auth enabled. |
| `--spi-email-sender-ext-email-override-user` | no |  | From email address. |
| `--spi-email-sender-ext-email-override-password` | no |  | From email address. |
| `--spi-email-sender-ext-email-override-ssl` | no | `false` | `true` for SSL enabled. |
| `--spi-email-sender-ext-email-override-starttls` | no | `false` | `true` for StartTLS enabled. |
| `--spi-email-sender-ext-email-override-port` | no | `25` | SMTP port. |
| `--spi-email-sender-ext-email-override-from-display-name` | no |  | From email address display name. |
| `--spi-email-sender-ext-email-override-reply-to` | no |  | Reply-to email address. |
| `--spi-email-sender-ext-email-override-reply-to-display-name` | no |  | Reply-to email address display name. |
| `--spi-email-sender-ext-email-override-envelope-from` | no |  | Envelope-from email address. |

### JAR Folder Theme Provider

This includes an implementation of `ThemeProvider` that dynamically loads theme JARs from a specified directory at runtime. This is useful for deploying packaged themes without requiring a restart of Keycloak. The specified directory is scanned every 1 minute for JAR files both at the top level, and 1 directory deep. The JAR files placed in the top level will expose the enclosed themes to all realms. The subdirectories are meant to be named with realm names that should be allowed to access the JAR files contained in those subdirectories.

In order to workaround some issues with the `ThemeProvider` API, subdirectory themes are named as `<realmName>--<themeName>`. Also, subdirectory themes are **only** available in the Admin UI for selection when you are logged in to that realm's Admin UI, **not** the `master` Admin UI.

The following variables can be set in order to configure this provider:

| Variable | Required | Default | Description |
| ---- | ---- | ---- | ---- |
| `--spi-theme-cache-themes` | yes | true | Must be set to `false` in order to use this provider. |
| `--spi-theme-ext-theme-jar-folder-dir` | yes |  | Directory to be watched by this provider for theme JARs. |

---

All documentation, source code and other files in this repository are Copyright 2024 Phase Two, Inc.
