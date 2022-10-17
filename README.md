> :rocket: **Try it for free** in the new Phase Two [keycloak managed service](https://phasetwo.io/dashboard/?utm_source=github&utm_medium=readme&utm_campaign=keycloak-magic-link). See the [announcement and demo video](https://phasetwo.io/blog/self-service/) for more information.

# keycloak-themes

Themes and theme utilities meant for simple theme customization without deploying a packaged theme.

- A modified login theme that allows colors, logo, CSS to be loaded from Realm attributes. 
- An implementation of `ThemeProvider` that loads named Freemarker templates from Realm attributes. Currently only for email.

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

## Overview

### Login theme

The login theme is named `attributes`. It assumes you will store the values as Realm attributes with the following keys:

- `_providerConfig.assets.login.css`: CSS you want to be loaded after the standard login.css
- `_providerConfig.assets.login.backgroundColor`: 
- `_providerConfig.assets.login.primaryColor`: 
- `_providerConfig.assets.login.secondaryColor`:
- `_providerConfig.assets.logo.url`: URL of logo file that will be served as the `div.kc-logo-text.background-image`. Constrained to 150x150.
- `_providerConfig.assets.favicon.url`: URL of the favicon

### Email theme

The custom `ThemeProvider` installs one email theme called `attributes` which allows you to override any .ftl template (from base) using Realm attributes with the following key format:
```
_providerConfig.theme.email.templates.<some-template.ftl>
```

Messages can be overridden with the following key format:
```
_providerConfig.theme.email.messages.<message-key>
```

There is an experimental feature that allows you to select a different base theme, but it doesn't work reliably yet. To use that, set the following variable with the theme you want to override:
```
_providerConfig.theme.email.parent
```

---

All documentation, source code and other files in this repository are Copyright 2022 Phase Two, Inc.

