> :rocket: **Try it for free** in the new Phase Two [keycloak managed service](https://phasetwo.io/dashboard/?utm_source=github&utm_medium=readme&utm_campaign=keycloak-themes). See the [announcement and demo video](https://phasetwo.io/blog/self-service/) for more information.

# keycloak-themes

Themes and theme utilities meant for simple theme customization without deploying a packaged theme.

- A modified login theme that allows colors, logo, CSS to be loaded from Realm attributes. 
- An implementation of `ThemeProvider` that loads named Freemarker templates and messages from Realm attributes. Currently only for email.
- An implementation of `EmailTemplateProvider` that allows the use of mustache.js templates.

This extension is used in the [Phase Two](https://phasetwo.io) cloud offering, and is released here as part of its commitment to making its [core extensions](https://phasetwo.io/docs/introduction/open-source) open source. Please consult the [license](COPYING) for information regarding use.

## Quick start

The easiest way to get started is our [Docker image](https://quay.io/repository/phasetwo/phasetwo-keycloak?tab=tags). Documentation and examples for using it are in the [phasetwo-containers](https://github.com/p2-inc/phasetwo-containers) repo. The most recent version of this extension is included.

## Installation

If you wish to build this yourself, you can do so with a few simple steps:

1. Build the jar:
```
mvn clean install
```

2. Copy the jar produced in `target/` to your `providers` directory (for Quarkus) or `standalone/deployments` directory (for legacy) and rebuild/restart keycloak.

After #1, you can also run `docker-compose up` if you want to take a quick look.

## Overview

### Login theme

The login theme is named `attributes`. It assumes you will store the values as Realm attributes with the following keys:

- `_providerConfig.assets.login.css`: CSS you want to be loaded after the standard login.css
- `_providerConfig.assets.login.backgroundColor`: override for `--pf-global--primary-color--100`.
- `_providerConfig.assets.login.primaryColor`: override for `--pf-global--secondary-color--100`.
- `_providerConfig.assets.login.secondaryColor`: override for `--pf-global--BackgroundColor--100`.
- `_providerConfig.assets.logo.url`: URL of logo file that will be served as the `div.kc-logo-text.background-image`. Constrained to 150x150.
- `_providerConfig.assets.favicon.url`: URL of the favicon

#### Example CSS overrides

There are 3 examples of CSS themes that can be loaded using the property above. They are in the `examples/` directory. You can either set these as the `_providerConfig.assets.login.css` Realm attribute, or, if you are using the Phase Two admin console theme, set them in the **Styles** -> **Login** section.

* Consumer
* Enterprise
* SaaS

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

### Mustache templates

The implementation of `EmailTemplateProvider` that allows the use of mustache.js templates will need to override the default implementation in Keycloak. This has to be specified as an SPI override at startup. If you want to use it, you will need to set the following command line flags for `start` or `start-dev`:
```
--spi-email-template-provider=freemarker-plus-mustache --spi-email-template-freemarker-plus-mustache-enabled=true
```

#### Notes
- For the underlying implementation, we use Sam Pullara's [mustache.java](https://github.com/spullara/mustache.java).

#### Issues
- We get equivalent funcationlity to the methods like `linkExpirationFormatter(linkExpiration)` by using the library's lambda functionality, and using the mustache-y syntax `{{#linkExpirationFormatter}}{{linkExpiration}}{{/linkExpirationFormatter}}`, but there isn't complete coverage yet.
- There is essentially no i18n at this point, so only the english templates work.

---

All documentation, source code and other files in this repository are Copyright 2023 Phase Two, Inc.
