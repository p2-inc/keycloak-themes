# Phase Two Customizations

## Running App

From the theme directory, start Keycloak with the correct Phase Two image automatically:

```bash
pnpm start-keycloak
```

Docker must be installed and running.

## Customizations

Phase Two has added additional functionality to the Admin UI. Those additions live in this `phaseII` folder and are integrated into the owned files listed below. Keycloakify handles keeping the base admin UI up to date — no tag syncing or branching from upstream KC is required.

### Updating Phase II Customizations

When changes are needed, the following files are owned by us (keycloakify warning headers removed) and contain the Phase Two integrations:

- `src/admin/PageNav.tsx` — exports `LeftNav`, adds `<Extensions />` nav group (orgs + styles)
- `src/admin/context/access/Access.tsx` — uses `ExtendedAccessType` from `phaseII/access/access.tsx`
- `src/admin/routes.tsx` — includes orgs and custom-styles routes
- `src/admin/help-urls.ts` — spreads `PhaseTwoHelpUrls`
- `src/admin/user/routes/User.tsx` — adds `user-orgs` to the `UserTab` type
- `src/admin/user/EditUser.tsx` — adds `<UserOrgs />` tab
- `src/admin/realm-settings/routes/RealmSettings.tsx` — adds `attributes` to `RealmSettingsTab` type
- `src/admin/realm-settings/RealmSettingsTabs.tsx` — adds `<RealmSettingsAttributeTab />`
- `src/admin/identity-providers/IdentityProvidersSection.tsx` — `OrganizationLink` handles Phase Two org links via `home.idp.discovery.org`
- `src/admin/realm-settings/GeneralTab.tsx` — adds `isReadOnly` to the realm name `ClipboardCopy`

#### phaseII folder contents

- **orgs** — Organizations UI, mostly independent; imports from `ui-shared` and `src/components`
- **custom-styles** — Custom Styles UI, mostly independent; imports from `ui-shared` and `src/components`
- **navigation** — Extensions nav group component
- **access** — `ExtendedAccessType` extending KC's `AccessType` with org permissions
- **user** — `UserOrgs` tab component for the user details view
- **realm-settings** — Realm attributes tab component

## Building

Follow the build instructions in the root README.
