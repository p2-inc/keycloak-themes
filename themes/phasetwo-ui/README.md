# phasetwo-ui

A Keycloakify + shadcn/ui theme for Keycloak that provides fully customizable login, admin, account, and email themes. Colors, logos, and CSS can be configured at runtime via Realm attributes — no redeployment required.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 10+
- [Docker](https://docs.docker.com/get-docker/) (for local Keycloak dev environment)

## Getting started

```bash
pnpm install
```

> `postinstall` runs `keycloakify sync-extensions` automatically, which copies managed page files into `src/login/pages/`.

## Development

### Vite dev server

Runs the theme in Storybook-compatible preview mode (no Keycloak required):

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

### Storybook

Browse and interact with every login page in isolation:

```bash
pnpm storybook
```

Open [http://localhost:6006](http://localhost:6006). Stories live alongside their pages as `Page.stories.tsx` files.

Run Storybook tests headlessly (requires Playwright):

```bash
pnpm vitest
```

### Full Keycloak environment — two modes

#### Option A: Hot-reload dev mode (recommended while building the theme)

Uses `keycloakify start-keycloak`, which watches your source files, rebuilds the JAR on every save, and reloads the theme inside a live Keycloak container. No manual build step required.

```bash
pnpm start-keycloak
```

- Starts `quay.io/phasetwo/phasetwo-keycloak:latest` via Docker
- Uses keycloakify's built-in test realm (a full Keycloak realm with all standard clients pre-configured)
- Rebuilds & hot-swaps the theme JAR whenever you save a file
- Open [http://localhost:8080/auth](http://localhost:8080/auth) — changes appear on next page load

> Theme caching is disabled (`--spi-theme-cache-themes=false`) so a hard-refresh always shows the latest build.

> **Note:** This mode uses keycloakify's default realm, not the `docker/realm-export.json`. If you need style attributes pre-seeded (logo, colors, test orgs), use Option B instead.

#### Option B: Stable Docker Compose mode (integration tests / demos)

The `docker/` directory contains a `docker-compose.yml` that mounts the pre-built theme JAR. Use this when you want a stable environment for running the E2E test suite or demoing the theme.

**Step 1 — build the theme JAR:**

```bash
pnpm build
```

This produces `../../target/phasetwo-ui/phasetwo-ui-theme.jar`.

**Step 2 — start Keycloak:**

```bash
pnpm docker:start
```

Keycloak starts at [http://localhost:8080/auth](http://localhost:8080/auth). On first run it imports `docker/realm-export.json`.

```bash
pnpm docker:logs   # tail Keycloak output
pnpm docker:stop   # shut down (add --volumes to also wipe data)
```

#### Test credentials

| URL | Username | Password | Notes |
|-----|----------|----------|-------|
| [Admin console (master)](http://localhost:8080/auth/admin) | `admin` | `admin` | Master realm superadmin |
| [Admin console (phasetwo-ui realm)](http://localhost:8080/auth/admin/phasetwo-ui/console) | `admin` | `admin` | Realm admin |
| Login page | `org-admin` | `password` | Org admin test user |
| Login page | `org-member` | `password` | Org member test user |

#### Seeding organizations

Use the root `scripts/seed-orgs.mjs` to create test organizations after startup:

```bash
# Create 5 organizations with 3 members each
KEYCLOAK_USERNAME=admin KEYCLOAK_PASSWORD=admin \
  node ../../scripts/seed-orgs.mjs \
  --realm phasetwo-ui \
  --count 5 \
  --user-count 10
```

## Testing

### API tests (no browser, no Keycloak required by default)

The `e2e/api/` suite runs against the Phase Two REST API. By default it targets a running Docker container; skip it entirely if none is running.

```bash
pnpm test:e2e
```

These tests cover org CRUD, member add/remove, and role grant/verify. They run without a browser and are fast enough for CI.

### Integration tests (browser + live Keycloak)

The full E2E suite adds browser-based tests for admin UI navigation, the Organizations panel, and the Styles panel. It requires the Docker Compose environment to be running.

**Step 1 — start the environment** (see Option B above):

```bash
pnpm build && pnpm docker:start
```

Wait until Keycloak is healthy (watch with `pnpm docker:logs`).

**Step 2 — run the full suite:**

```bash
pnpm test:e2e:integration
```

This sets `PLAYWRIGHT_INTEGRATION=true`, which enables the browser projects in `playwright.config.ts` and runs `global-setup.ts` to seed fixture data (test org, members, roles) before any test.

**Interactive UI mode:**

```bash
pnpm test:e2e:ui
```

Opens the Playwright UI for step-by-step debugging with timeline and snapshots.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KC_BASE_URL` | `http://localhost:8080/auth` | Keycloak base URL |
| `KC_REALM` | `phasetwo-ui` | Realm under test |
| `KC_ADMIN_USER` | `admin` | Admin username for API calls |
| `KC_ADMIN_PASSWORD` | `admin` | Admin password |
| `PLAYWRIGHT_INTEGRATION` | — | Set to `true` to enable browser projects |

### Test layout

```
e2e/
  helpers/api.ts          API helper (token, org/member/role CRUD)
  global-setup.ts         Creates fixture org + members before tests run
  auth.setup.ts           Browser login → saves auth state to e2e/.auth/
  api/
    organizations.spec.ts API-level org/member/role tests (always run)
  admin/
    nav.spec.ts           Admin console sidebar navigation
    organizations.spec.ts Organizations UI — list, create, members, roles
    styles.spec.ts        Styles panel — general + login fields, save + verify
```

## Building

Build the theme JAR for deployment:

```bash
pnpm build
```

Build just the Vite app (without Keycloakify packaging):

```bash
pnpm build:app
```

Build the Storybook static site:

```bash
pnpm build-storybook
```

## Theme configuration

### Activating the theme

In Keycloak Admin → Realm Settings → Themes, set:

| Theme type | Value |
|------------|-------|
| Login | `phasetwo-ui` |
| Admin | `phasetwo-ui` |
| Account | `phasetwo-ui` |
| Email | `phasetwo-ui` |

### Runtime style attributes

Colors, logos, and custom CSS are stored as Realm attributes and applied without redeployment. In the Admin UI go to **Styles → General** and **Styles → Login**, or set the attributes directly:

#### General

| Attribute key | Description |
|---------------|-------------|
| `_providerConfig.assets.logo.url` | Logo shown in the login panel and admin UI |
| `_providerConfig.assets.favicon.url` | Browser favicon |
| `_providerConfig.assets.appicon.url` | App icon (e.g. mobile/PWA) |

#### Login theme

| Attribute key | Description | Default |
|---------------|-------------|---------|
| `_providerConfig.assets.login.primaryColor` | Brand primary color (buttons, links, sidebar) | `#3b82f6` |
| `_providerConfig.assets.login.secondaryColor` | Secondary accent color | `#60a5fa` |
| `_providerConfig.assets.login.backgroundColor` | Page background | `#ffffff` |
| `_providerConfig.assets.login.css` | Arbitrary CSS injected after theme styles | — |

The `docker/realm-export.json` seeds these defaults on first import:

```
Logo:     https://phasetwo.io/img/logo_phase_slash.svg
Favicon:  https://phasetwo.io/img/favicon.svg
Primary:  #3b82f6
Secondary: #60a5fa
Background: #ffffff
```

## Customizing pages

Page components managed by `@oussemasahbeni/keycloakify-login-shadcn` carry a `WARNING` header — edit them only after claiming ownership:

```bash
pnpm exec keycloakify own --path "login/pages/<page-name>/Page.tsx"
```

To revert a page to its upstream version:

```bash
pnpm exec keycloakify own --path "login/pages/<page-name>/Page.tsx" --revert
```

After a `pnpm install`, `sync-extensions` will restore any unowned files. Owned files are left untouched.

## Project structure

```
src/
  login/          Login theme (Keycloakify + shadcn/ui)
    pages/        One Page.tsx + Page.stories.tsx per Keycloak page
    components/   Shared login components (Template, SocialProviders, …)
    assets/       Static assets (logos, shapes)
    hooks/        Dynamic CSS / favicon / realm assets hooks
  admin/          Admin UI extensions (Phase Two-specific panels)
    phaseII/      Custom Styles, Organizations, etc.
  account/        Account console theme
  email/          Email theme templates
docker/
  docker-compose.yml   Local Keycloak container
  realm-export.json    Realm bootstrap (themes, users, style defaults)
.storybook/       Storybook config and Vitest setup
```
