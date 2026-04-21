# Plan: Merge attributes-v3 into phasetwo-ui

Consolidate both themes into a single JAR. attributes-v3 is not yet launched so no backwards compatibility needed.

## Goal

One build pipeline, one JAR. phasetwo-ui emits all four theme types: login + email + account + admin.

## Core insight

phasetwo-ui's core login pages are already more complete than attributes-v3's. What needs to move over is the PhaseTwo-specific extension pages, the dynamic branding hooks, and the email templates.

## What to move

### 1. Extension pages — copy wholesale

`attributes-v3/src/login/pages/extensions/` → `phasetwo-ui/src/login/pages/extensions/`

- `magic-link/` — email-confirmation, OTP form, view-email, view-email-continuation pages
- `orgs/` — org selection, IDP selection, invitations, login-select-idp, hidpd-select-idp, idp-validation
- `login-recaptcha/` — reCAPTCHA integration

### 2. Dynamic branding hooks — copy to login hooks

`attributes-v3/src/hooks/useDynamicCss.ts` → `phasetwo-ui/src/login/hooks/useDynamicCss.ts`

Contains three hooks:
- `useDynamicCss` — injects per-realm CSS variables from Phase Two assets endpoint (primary/secondary/background color overrides mapped to shadcn tokens)
- `useDynamicFavicon` — sets favicon and apple-touch-icon from realm assets endpoint
- `useRealmAssetsBase` — utility to derive realm base path from `resourcesPath` or `loginAction`

### 3. Email templates — copy wholesale

`attributes-v3/src/email/` → `phasetwo-ui/src/email/`

Pure FreeMarker/mustache files, no JS dependencies. Includes:
- `html/` — HTML email templates (invitation, org-invite, password-reset, email-verification, events, etc.)
- `text/` — plain-text versions of the same
- `messages/` — 31 language `.properties` files
- `theme.properties`

### 4. KcContext — merge, do not replace

attributes-v3's `src/login/KcContext.ts` defines custom `kcContext` types for the extension pages (magic-link, orgs, recaptcha). These need to be merged into phasetwo-ui's existing `src/login/KcContext.ts` — add the extension page union members, do not overwrite existing types.

### 5. KcPage — add extension routing cases

Add the extension page `switch` cases from attributes-v3's `src/login/KcPage.tsx` into phasetwo-ui's existing `KcPage.tsx`. Keep all existing phasetwo-ui cases.

## What does NOT move

| Item | Reason |
|---|---|
| `src/login/pages/default/` | phasetwo-ui already has proper implementations |
| attributes-v3 core pages (login, register, etc.) | phasetwo-ui's are more complete |
| Storybook setup | Out of scope |
| `src/components/` shadcn UI | Already duplicated in phasetwo-ui; add any missing components individually if needed |

## Package and config changes (phasetwo-ui)

**`package.json`** — add runtime dependency:
```
"@keycloakify/email-native": "~260007.0.0"
```

**`vite.config.ts`** — add to the `keycloakify()` plugin config:
```ts
environmentVariables: [
  { name: "SHOW_DARK_MODE_TOGGLE", default: "false" },
],
```

## After the merge

- Delete the `themes/attributes-v3/` directory
- Run `pnpm dev` or build once — Keycloakify regenerates `src/kc.gen.tsx` automatically via the `sync-extensions` postinstall step, picking up the new theme types and env vars

## What you get

| Theme type | Source |
|---|---|
| Login | phasetwo-ui core pages + attributes-v3 extension pages |
| Email | attributes-v3 FreeMarker templates |
| Account | phasetwo-ui Single-Page account console |
| Admin | phasetwo-ui PhaseII admin extensions |
